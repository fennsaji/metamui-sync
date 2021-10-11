import { connection, did, utils, token, transaction, balance } from 'mui-metablockchain-sdk';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';

async function addNewDid(newDidObj: any, api = false) {
    try {
        const provider = api || (await connection.buildConnection('local', true));

        const tx = provider.tx.did.add(
            newDidObj.public_key,
            did.sanitiseDid(newDidObj.identity),
            newDidObj.metadata
        );


        const keyring = new Keyring({ type: 'sr25519' });
        const sig_key_pair = await keyring.addFromUri('//Alice');
        console.log(sig_key_pair);


        await new Promise((resolve, reject) => tx.signAndSend(sig_key_pair, ({ status, dispatchError }: any) => {
            console.log('Transaction status:', status.type);
            console.log(JSON.stringify(dispatchError))
            if (dispatchError) {
                if (dispatchError.isModule) {
                    // for module errors, we have the section indexed, lookup
                    //const decoded = api.registry.findMetaError(dispatchError.asModule);
                    //const { documentation, name, section } = decoded;
                    //console.log(`${section}.${name}: ${documentation.join(' ')}`);
                    reject('Dispatch Module error');
                } else {
                    // Other, CannotLookup, BadOrigin, no extra info
                    console.log(dispatchError.toString());
                    reject('Dispatch error');
                }
            } else if (status.isFinalized) {
                console.log('Finalized block hash', status.asFinalized.toHex());
                resolve(status.asFinalized.toHex());
            }
        }));
    } catch (err) {
        console.log("Create DID")
        console.log(err);
        throw new Error(err);
    }
}

async function removeDid(didString: String, api = false) {
    try {
        const provider = api || (await connection.buildConnection('local', true));

        const tx = provider.tx.did.remove(
            did.sanitiseDid(didString)
        );

        const keyring = new Keyring({ type: 'sr25519' });
        const sig_key_pair = await keyring.addFromUri('//Alice');
        console.log(sig_key_pair);

        await new Promise((resolve, reject) => tx.signAndSend(sig_key_pair, ({ status, dispatchError }: any) => {
            console.log('Transaction status:', status.type);
            console.log(JSON.stringify(dispatchError))
            if (dispatchError) {
                if (dispatchError.isModule) {
                    // for module errors, we have the section indexed, lookup
                    //const decoded = api.registry.findMetaError(dispatchError.asModule);
                    //const { documentation, name, section } = decoded;
                    //console.log(`${section}.${name}: ${documentation.join(' ')}`);
                    reject('Dispatch Module error');
                } else {
                    // Other, CannotLookup, BadOrigin, no extra info
                    console.log(dispatchError.toString());
                    reject('Dispatch error');
                }
            } else if (status.isFinalized) {
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
    addNewDid,
    removeDid,
}