import { checkValidatorsEqual, getValidators, setValidator } from "./helper/validators";

async function syncValidators(providerSyncFrom, providerSyncTo, rootKeyPair, nonce) {
  let validators = await getValidators(providerSyncFrom);
  let validatorPromises = [];

  // console.log('Sync Validators Started');

  for (let i = 0; i<validators.length; i++) {
    validatorPromises.push(setValidator(validators[i], rootKeyPair, providerSyncTo, nonce).catch(console.log));
    nonce = +nonce+1;
  }

  try {
    Promise.all(validatorPromises.map(p => p.catch(e => e)));
  } catch (e) {}

  console.log('Validators Sync Completed');
  return nonce;


  // let updatedValidators = await getValidators(providerSyncTo);

  // console.log('Validators Equal:', checkValidatorsEqual(validators, updatedValidators));
}

export {
  syncValidators,
}