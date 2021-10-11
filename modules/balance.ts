const { balance, transaction, connection } = require('mui-metablockchain-sdk');
const { Keyring, ApiPromise, WsProvider } = require('@polkadot/api');

function getBalance(did, api) {
    try {
        return balance.getBalance(did, api);
    } catch(err) {
        console.log(err);
        throw new Error('Something went wrong');
    }
}

async function transfer(toDid, amount, api = false) {
    try {
        const provider = api || (await connection.buildConnection('local', true));

        const keyring = new Keyring({ type: 'sr25519' });
        const sig_key_pair = await keyring.addFromUri('//Alice');
        console.log(sig_key_pair);

        await transaction.sendTransaction(sig_key_pair, toDid, amount, provider);
    } catch(err) {
        console.log('Transfer Amount')
        console.log(err);
        throw new Error('Something went wrong');
    }
}

async function transferWithMemo(toDid, amount, memo, api = false) {
    try {
        const provider = api || (await connection.buildConnection('local', true));

        const keyring = new Keyring({ type: 'sr25519' });
        const sig_key_pair = await keyring.addFromUri('//Alice');
        console.log(sig_key_pair);

        await transaction.transfer(sig_key_pair, toDid, amount, memo, provider);
    } catch(err) {
        console.log('Transfer Amount With Memo');
        console.log(err);
        throw new Error('Something went wrong');
    }
}

export {
    getBalance,
    transfer,
    transferWithMemo,
}