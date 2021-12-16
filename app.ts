import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { checkNodeAuthsEqual, getAdditionalConnections, getNodeData, getWellKnownNodes } from "./src/helper/node-auth";
import { checkTokenAccountsEqual, getTokenAccounts } from "./src/helper/token";
import { checkDidsEqual, createConnection, sleep } from "./src/helper/utils";
import { checkValidatorsEqual, getValidators } from "./src/helper/validators";
import { checkVCsEqual, getVCs } from "./src/helper/vc";
import { getDidAccountsSnapshot, syncDids, syncDidsBalance } from "./src/sync-dids";
import { syncNodeAuths } from "./src/sync-node-auth";
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

  const providerSyncFrom: any = await createConnection(syncFromUrl);
  const providerSyncTo: any = await createConnection(syncToUrl);

  const keyring = new Keyring({ type: 'sr25519' });
  const rootKeyPair = await keyring.addFromUri('//Alice');

  let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON();

  // Sync Did from one node to another
  await syncDids(providerSyncFrom, providerSyncTo, rootKeyPair, nonce);
  await syncDidsBalance(providerSyncFrom, providerSyncTo, rootKeyPair, nonce, true);

  // Sync validators
  await syncValidators(providerSyncFrom, providerSyncTo, rootKeyPair, nonce);

  await syncNodeAuths(providerSyncFrom, providerSyncTo, rootKeyPair);

  // Sync VC Pallet
  let addedVCs = await syncVcs(providerSyncFrom, providerSyncTo, rootKeyPair);

  // Sync Tokens
  await syncTokens(addedVCs, providerSyncFrom, providerSyncTo, rootKeyPair);
  
  nonce = await syncDidsBalance(providerSyncFrom, providerSyncTo, rootKeyPair, nonce, false);

  await sleep(5000);


  // Check All data equal
  // Check if Did Equal
  const nodeOneDids = await getDidAccountsSnapshot(providerSyncFrom);
  const nodeTwoDids = await getDidAccountsSnapshot(providerSyncTo);
  let errorDids = checkDidsEqual(nodeOneDids, nodeTwoDids);
  console.log('All Dids Equal:', errorDids.length == 0 ? true: false);

  // Check if validators equal
  let validators = await getValidators(providerSyncFrom);
  let updatedValidators = await getValidators(providerSyncTo);
  console.log('Validators Equal:', checkValidatorsEqual(validators, updatedValidators));

  // Checzk if vcs are equal
  let newVcs = await getVCs(providerSyncTo);
  let vcs = await getVCs(providerSyncFrom);
  console.log('VCS Equal:', checkVCsEqual(vcs, newVcs));

  // Check if tokens are equal
  let tokenAccounts = (await getTokenAccounts(providerSyncFrom)).filter(ta => ta?.tokenData?.currency_code);
  let newTokenAccounts = (await getTokenAccounts(providerSyncTo)).filter(ta => ta?.tokenData?.currency_code);
  console.log('Token Account Equal:', checkTokenAccountsEqual(tokenAccounts, newTokenAccounts));


  let nodeData = await getNodeData(providerSyncFrom);
  let newNodeData = await getNodeData(providerSyncTo);
  console.log('Node Auth Equal:', checkNodeAuthsEqual(nodeData, newNodeData));

  console.log('Finished Sync');
}

main();
