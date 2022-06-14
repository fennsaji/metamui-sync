
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

      await tx.signAndSend(signingKeypair, { nonce }, function ({ status, dispatchError, events }) {
        events
            .forEach(({ event: { data: [result] } }) => {
              if (result.isError) {
                let error = result.asError;
                if (error.isModule) {
                  const decoded = provider.registry.findMetaError(error.asModule);
                  const { docs, name, section } = decoded;
                  reject(new Error(`${section}.${name}`));
                } else {
                  reject(new Error(error.toString()));
                }
              }
            });  
        if (dispatchError) {
          reject(new Error(dispatchError.toString()));
        } else if (status.isInBlock) {
          resolve('Success');
        }
      });
    } catch (err) {
      reject(new Error(err));
    }
  });
}

/**
 * The function will perform a metamui transfer operation from the account of senderAccount to the
 * receiverDID.
 * Note : balanceCheck has not been included in the checks since sender not having balance
 * is handled in extrinsic, check test/transaction.js
 * @param {KeyPair} senderAccountKeyPair
 * @param {String} receiverDID
 * @param {String} amount In Lowest Form
 * @param {APIPromise} api (optional)
 * @param {int} nonce (optional)
 * @returns {Uint8Array}
 */
 async function sendTransaction(
  senderAccountKeyPair,
  receiverDID,
  amount,
  provider,
  nonce = -1,
) {
  return new Promise(async (resolve, reject) => {
    try {
      // check if the recipent DID is valid
      const receiverAccountID = await did.resolveDIDToAccount(receiverDID, provider);
      if (!receiverAccountID) {
        throw new Error('balances.RecipentDIDNotRegistered');
      }
      const tx = await provider.tx.balances
        .transfer(receiverAccountID, amount);
      const signedTx = tx.sign(senderAccountKeyPair, {nonce});
      await signedTx.send(function ({ status, dispatchError }) {
          console.log('Transaction status:', status.type);
          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = provider.registry.findMetaError(dispatchError.asModule);
              const { documentation, name, section } = decoded;
              // console.log(`${section}.${name}: ${documentation.join(' ')}`);
              reject(new Error(`${section}.${name}`));
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              // console.log(dispatchError.toString());
              reject(new Error(dispatchError.toString()));
            }
          } else if (status.isReady) {
            // console.log('Finalized block hash', status.asFinalized.toHex());
            resolve(status.type)
          }
        });
    } catch (err) {
      // console.log(err);
      reject(err);
    }
  });
}


export {
  storeDIDOnChain,
  sendTransaction,
}