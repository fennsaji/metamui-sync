
import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';

async function setBalance(receiverAccountID, free, reserved, signingKeypair, provider, nonce) {
  return new Promise(async (resolve, reject) => {
    try {
        const tx = provider.tx.sudo.sudo(
          provider.tx.balances.setBalance(receiverAccountID, free, reserved)
        );

        await tx.signAndSend(signingKeypair, { nonce }, function ({ status, dispatchError, events }) {
          events
            .forEach(({ event : { data: [result] } }) => {
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
          } else if (status.isReady) {
            resolve('Success');
          }
        });
      // }
    } catch (err) {
      reject(new Error(err));
    }
  });
}

export {
  setBalance,
}