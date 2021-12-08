import { checkValidatorsEqual, getValidators, setValidator } from "./helper/validators";
import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';

async function syncValidators(providerSyncFrom, providerSyncTo, rootKeyPair, nonce) {
  let validators = await getValidators(providerSyncFrom);
  nonce = (await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON();
  let validatorPromises = [];

  for (let i = 0; i<validators.length; i++) {
    validatorPromises.push(setValidator(validators[i], rootKeyPair, providerSyncTo, nonce).catch(err => {
      console.log('Sync Validator Error', {did: validators[i], err});
      throw err;
    }));
    nonce = +nonce+1;
  }

  try {
    await Promise.all(validatorPromises.map(p => p.catch(e => e)));
  } catch (e) {}

  console.log('Validators Sync Completed');
  return nonce;
}

export {
  syncValidators,
}