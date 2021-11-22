import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';

async function getValidators(api) {
  const provider = api || (await connection.buildConnection('local'));
  let members = (await provider.query.validatorSet.members()).toJSON();
  return members.map(did.sanitiseDid);
}

async function setValidator(didString, signingKeypair, api, nonce) {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = api || (await connection.buildConnection('local'));

      const tx = provider.tx.sudo.sudo(
        provider.tx.validatorSet.addMember(did.sanitiseDid(didString))
      );
      
      await tx.signAndSend(signingKeypair, {nonce}, function ({ status, dispatchError }){
        if (dispatchError) {
          reject(new Error(dispatchError.toString()));
        } else if (status.isFinalized) {
          resolve('Success');
        }
      });
    } catch (err) {
      reject(new Error(err));
    }
  });
}

export {
  getValidators,
  setValidator,
}