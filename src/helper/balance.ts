
import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';

async function setBalance(didString, free, reserved, signingKeypair, provider) {
  return new Promise(async (resolve, reject) => {
    try {
      const receiverAccountID = await did.resolveDIDToAccount(didString, provider);
      const tx = provider.tx.sudo.sudo(
        provider.tx.balances.setBalance(receiverAccountID, free, reserved)
      );
      let nonce = await provider.rpc.system.accountNextIndex(signingKeypair.address);
      await tx.signAndSend(signingKeypair, {nonce: -1}, function ({ status, dispatchError }) {
        if (dispatchError) {
          if (dispatchError.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = provider.registry.findMetaError(dispatchError.asModule);
            const { documentation, name, section } = decoded;
            reject(new Error(`${section}.${name}`));
          } else {
            // Other, CannotLookup, BadOrigin, no extra info
            console.log(dispatchError.toString());
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isFinalized) {
          resolve('Success');
        }
      });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

export {
  setBalance,
}