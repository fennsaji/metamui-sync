
import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';

function storeDIDOnChain(DID, signingKeypair, api = false) {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = api || (await connection.buildConnection('local'));

      const tx = provider.tx.did.add(DID.public_key, did.sanitiseDid(DID.identity), DID.metadata);

      let nonce = await provider.rpc.system.accountNextIndex(signingKeypair.address);
      await tx.signAndSend(signingKeypair, {nonce: -1}, function ({ status, dispatchError }){
        if (dispatchError) {
          if (dispatchError.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = provider.registry.findMetaError(dispatchError.asModule);
            const { documentation, name, section } = decoded;
            reject(new Error(`${section}.${name}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isFinalized) {
          resolve('Success');
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

export = {
  storeDIDOnChain,
}