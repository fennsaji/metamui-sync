import { connection, did, utils, token, transaction, balance } from 'mui-metablockchain-sdk';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';

async function removeDid(didString: String, sig_key_pair, api = false) {
    try {
        const provider = api || (await connection.buildConnection('local', true));

        const tx = provider.tx.did.remove(
            did.sanitiseDid(didString)
        );

        await new Promise((resolve, reject) => tx.signAndSend(sig_key_pair, ({ status, dispatchError }: any) => {
            console.log('Transaction status:', status.type);
            console.log(JSON.stringify(dispatchError))
            if (dispatchError) {
                if (dispatchError.isModule) {
                    reject('Dispatch Module error');
                } else {
                    // Other, CannotLookup, BadOrigin, no extra info
                    console.log(dispatchError.toString());
                    reject('Dispatch error');
                }
            } else if (status.isInBlock) {
                console.log('Finalized block hash', status.asFinalized.toHex());
                resolve(status.asFinalized.toHex());
            }
        }));
    } catch (err) {
        console.log("Remove DID")
        console.log(err);
        throw new Error(err);
    }
}

export {
    removeDid,
}