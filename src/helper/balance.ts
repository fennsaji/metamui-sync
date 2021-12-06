
import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';

async function setBalance(receiverAccountID, free, reserved, signingKeypair, provider, nonce) {
  return new Promise(async (resolve, reject) => {
    try {
        const tx = provider.tx.sudo.sudo(
          provider.tx.balances.setBalance(receiverAccountID, free, reserved)
        );

        await tx.signAndSend(signingKeypair, { nonce }, function ({ status, dispatchError }) {
          if (dispatchError) {
            reject(new Error(dispatchError.toString()));
          } else if (status.isInBlock) {
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