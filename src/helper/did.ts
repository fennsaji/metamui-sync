
import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';

function storeDIDOnChain(DID, signingKeypair, api, nonce) {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = api || (await connection.buildConnection('local'));

      const tx = provider.tx.did.add(DID.public_key, did.sanitiseDid(DID.identity), DID.metadata);
      // const txs = [
      //   provider.tx.did.add(DID.public_key, did.sanitiseDid(DID.identity), DID.metadata),
      // ];

      // provider.tx.utility
      // .batch(txs)
      // .signAndSend(signingKeypair, ({ status, dispatchError }) => {
      //   if (dispatchError) {
      //     reject(new Error(dispatchError.toString()));
      //   } else if (status.isInBlock) {
      //     resolve('Success');
      //   }
      // });

      await tx.signAndSend(signingKeypair, { nonce }, function ({ status, dispatchError }) {
          if (dispatchError) {
          reject(new Error(dispatchError.toString()));
        } else if (status.isReady) {
          resolve('Success');
        }
      });
    } catch (err) {
      reject(new Error(err));
    }
  });
}


export {
  storeDIDOnChain,
}