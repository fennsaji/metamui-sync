const { did, transaction, connection } = require('mui-metablockchain-sdk');
const { Keyring, ApiPromise, WsProvider } = require('@polkadot/api');

async function setBalance(recieverDid, newFree: Number, newReserved: Number, sig_key_pair, api = false) {
    try {
        const provider = api || (await connection.buildConnection('local', true));

        const receiverAccountID = await did.resolveDIDToAccount(recieverDid, provider);
        const tx = provider.tx.balances.setBalance(receiverAccountID, newFree, newReserved);

        await new Promise((resolve, reject) => tx.signAndSend(sig_key_pair, ({ status, dispatchError }: any) => {
            console.log('Transaction status:', status.type);
            console.log(JSON.stringify(dispatchError))
            if (dispatchError) {
                if (dispatchError.isModule) {
                    reject('Dispatch Module error');
                } else {
                    console.log(dispatchError.toString());
                    reject('Dispatch error');
                }
            } else if (status.isFinalized) {
                console.log('Finalized block hash', status.asFinalized.toHex());
                resolve(status.asFinalized.toHex());
            }
        }));
    } catch(err) {
        console.log('Set Balance');
        console.log(err);
        throw new Error('Something went wrong');
    }
}

async function forceTransfer(senderDid: String, recieverDid: String, amount: Number, sig_key_pair, api = false) {
    try {
        const provider = api || (await connection.buildConnection('local', true));

        const senderAccountID = await did.resolveDIDToAccount(senderDid, provider);

        const recieverAccountID = await did.resolveDIDToAccount(recieverDid, provider);
        const tx = provider.tx.balances.forceTransfer(senderAccountID, recieverAccountID, amount);

        await new Promise((resolve, reject) => tx.signAndSend(sig_key_pair, ({ status, dispatchError }: any) => {
            console.log('Transaction status:', status.type);
            console.log(JSON.stringify(dispatchError))
            if (dispatchError) {
                if (dispatchError.isModule) {
                    reject('Dispatch Module error');
                } else {
                    console.log(dispatchError.toString());
                    reject('Dispatch error');
                }
            } else if (status.isFinalized) {
                console.log('Finalized block hash', status.asFinalized.toHex());
                resolve(status.asFinalized.toHex());
            }
        }));
    } catch(err) {
        console.log('Set Balance');
        console.log(err);
        throw new Error('Something went wrong');
    }
}

export {
    setBalance,
    forceTransfer,
}