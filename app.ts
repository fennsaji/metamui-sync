import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { checkTokenAccountsEqual, getTokenAccounts } from "./src/helper/token";
import { checkDidsEqual, createConnection, sleep } from "./src/helper/utils";
import { checkValidatorsEqual, getValidators } from "./src/helper/validators";
import { checkVCsEqual, getVCs } from "./src/helper/vc";
import { getDidAccountsSnapshot, syncDids, syncDidsBalance } from "./src/sync-dids";
import { syncTokens } from "./src/sync-tokens";
import { syncValidators } from "./src/sync-validator-set";
import { syncVcs } from "./src/sync-vcs";

async function main() {
  const localUrl = 'ws://127.0.0.1:9944';
  const devUrl = 'wss://n3testnet.metabit.exchange';
  const testnetUrl = 'wss://n2testnet.metabit.exchange';
  const newNodeUrl = 'wss://n4testnet.metabit.exchange';

  let syncFromUrl = devUrl;
  let syncToUrl = localUrl;

  await cryptoWaitReady();

  const providerSyncFrom: any = await createConnection(syncFromUrl)
  const providerSyncTo: any = await createConnection(syncToUrl)

  const keyring = new Keyring({ type: 'sr25519' });
  const rootKeyPair = await keyring.addFromUri('//Alice');

  let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON();

  // Sync Did from one node to another
  nonce = await syncDids(providerSyncFrom, providerSyncTo, rootKeyPair, nonce);

  nonce = await syncDidsBalance(providerSyncFrom, providerSyncTo, rootKeyPair, nonce);

  // Sync validators
  syncValidators(providerSyncFrom, providerSyncTo, rootKeyPair, nonce);

  // Sync VC Pallet
  let addedVCs = await syncVcs(providerSyncFrom, providerSyncTo, rootKeyPair);

  // Sync Tokens
  await syncTokens(addedVCs, providerSyncFrom, providerSyncTo, rootKeyPair);
  
  nonce = await syncDidsBalance(providerSyncFrom, providerSyncTo, rootKeyPair, nonce);

  await sleep(10000);


  // Check All data equal
  // Check if Did Equal
  const nodeOneDids = await getDidAccountsSnapshot(providerSyncFrom);
  const nodeTwoDids = await getDidAccountsSnapshot(providerSyncTo);
  let errorDids = checkDidsEqual(nodeOneDids, nodeTwoDids);
  console.log('All Dids Equal:', errorDids.length == 0 ? true: false);
  console.log(errorDids);

  // Check if validators equal
  let validators = await getValidators(providerSyncFrom);
  let updatedValidators = await getValidators(providerSyncTo);
  console.log('Validators Equal:', checkValidatorsEqual(validators, updatedValidators));

  // Check if vcs are equal
  let newVcs = await getVCs(providerSyncTo);
  let vcs = await getVCs(providerSyncFrom);
  console.log('VCS Equal', checkVCsEqual(vcs, newVcs));

  // Check if data equalx
  let tokenAccounts = (await getTokenAccounts(providerSyncFrom)).filter(ta => ta?.tokenData?.currency_code);
  let newTokenAccounts = (await getTokenAccounts(providerSyncTo)).filter(ta => ta?.tokenData?.currency_code);
  console.log('Token Account Equal:', checkTokenAccountsEqual(tokenAccounts, newTokenAccounts));
  console.log('Finished Sync');
}

main();
