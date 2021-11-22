import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { METABLOCKCHAIN_TYPES } from "./helper/utils";
import { getValidators, setValidator } from "./helper/validators";

async function syncValidators(syncFromUrl, syncToUrl) {
  const providerFrom = new WsProvider(syncFromUrl);
  const providerSyncFrom: any = await ApiPromise.create({
    provider: providerFrom,
    types: METABLOCKCHAIN_TYPES,
  });

  const providerTo = new WsProvider(syncToUrl);
  const providerSyncTo = await ApiPromise.create({
    provider: providerTo,
    types: METABLOCKCHAIN_TYPES,
  });

  const keyring = new Keyring({ type: 'sr25519' });
  const rootKeyPair = await keyring.addFromUri('//Alice');

  let validators = await getValidators(providerSyncFrom);
  let validatorPromises = [];
  console.log(validators);
  let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON();
  for (let i = 0; i<validators.length; i++) {
    validatorPromises.push(setValidator(validators[i], rootKeyPair, providerSyncTo, nonce));
    nonce = +nonce+1;
  }
  try {
    await Promise.all(validatorPromises.map(p => p.catch(e => e)));
  } catch (e) { }
  console.log('Done');
}

export {
  syncValidators,
}