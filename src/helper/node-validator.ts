import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';

async function getNodeValidators(api=false) {
  const provider = api || (await connection.buildConnection('local'));
  return provider.query.nodeValidator.validators();
}

async function addNodeValidator(validator, senderAccountKeyPair, api=false, nonce=-1) {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = api || (await connection.buildConnection('local'));
      const tx = provider.tx.sudo.sudo(provider.tx.nodeValidator.addValidator(
        validator
      ));
      nonce = nonce ?? await provider.rpc.system.accountNextIndex(senderAccountKeyPair.address);
      await tx.signAndSend(senderAccountKeyPair, { nonce }, function ({ status, dispatchError, events }) {
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
          resolve(true);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

export {
  getNodeValidators,
  addNodeValidator,
}