import { checkValidatorsEqual, getValidators, setValidator } from "./helper/validators";

async function syncValidators(providerSyncFrom, providerSyncTo, rootKeyPair) {
  let validators = await getValidators(providerSyncFrom);
  let validatorPromises = [];

  console.log('Sync Validators Started');

  let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON();
  for (let i = 0; i<validators.length; i++) {
    validatorPromises.push(setValidator(validators[i], rootKeyPair, providerSyncTo, nonce));
    nonce = +nonce+1;
  }

  try {
    await Promise.all(validatorPromises.map(p => p.catch(e => e)));
  } catch (e) {}

  console.log('Sync Completed');

  let updatedValidators = await getValidators(providerSyncTo);

  console.log('Validators Equal:', checkValidatorsEqual(validators, updatedValidators));
}

export {
  syncValidators,
}