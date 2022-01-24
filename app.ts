import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { checkIfMembersPrimeEqual, checkIfProposalsEqual, getCouncilData } from "./src/helper/council";
import { checkNodeAuthsEqual, getAdditionalConnections, getNodeData, getWellKnownNodes } from "./src/helper/node-auth";
import { checkTokenAccountsEqual, getTokenAccounts } from "./src/helper/token";
import { checkDidsEqual, createConnection, sleep } from "./src/helper/utils";
import { checkValidatorsEqual, getValidators } from "./src/helper/validators";
import { checkVCsEqual, getVCs } from "./src/helper/vc";
import { syncCouncil } from "./src/sync-council";
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
  await syncDids(providerSyncFrom, providerSyncTo, rootKeyPair, nonce); // Block
  await syncDidsBalance(providerSyncFrom, providerSyncTo, rootKeyPair, nonce, true); // Ready

  // Sync validators
  await syncValidators(providerSyncFrom, providerSyncTo, rootKeyPair, nonce); // Ready

  await syncNodeAuths(providerSyncFrom, providerSyncTo, rootKeyPair); // Ready

  // Sync VC Pallet
  let addedVCs = await syncVcs(providerSyncFrom, providerSyncTo, rootKeyPair); // Block

  // Sync Tokens
  await syncTokens(addedVCs, providerSyncFrom, providerSyncTo, rootKeyPair); // Ready


  // Sync Council
  // NOTE: did:ssid:swn is added as council if it's not there, it's for creating proposals
  // And swn will be owner of proposal with his vote as yes
  await syncCouncil(providerSyncFrom, providerSyncTo, rootKeyPair);
  
  nonce = await syncDidsBalance(providerSyncFrom, providerSyncTo, rootKeyPair, nonce, false); // Ready

  await sleep(5000);


  // Check All data equal
  // Check if Did Equal
  const nodeOneDids = await getDidAccountsSnapshot(providerSyncFrom);
  const nodeTwoDids = await getDidAccountsSnapshot(providerSyncTo);
  let errorDids = checkDidsEqual(nodeOneDids, nodeTwoDids);
  console.log('All Dids Equal-', nodeOneDids.length, '&', nodeTwoDids.length, ':', errorDids.length == 0 ? true: false);

  // Check if validators equal
  let validators = await getValidators(providerSyncFrom);
  let updatedValidators = await getValidators(providerSyncTo);
  console.log('Validators Equal-', validators.length, '&', updatedValidators.length, ':', checkValidatorsEqual(validators, updatedValidators));

  // Checzk if vcs are equal
  let vcs = await getVCs(providerSyncFrom);
  let newVcs = await getVCs(providerSyncTo);
  console.log('VCS Equal-', vcs.length, '&', newVcs.length, ':' , checkVCsEqual(vcs, newVcs));

  // Check if tokens are equal
  let tokenAccounts = (await getTokenAccounts(providerSyncFrom)).filter(ta => ta?.tokenData?.currency_code);
  let newTokenAccounts = (await getTokenAccounts(providerSyncTo)).filter(ta => ta?.tokenData?.currency_code);
  console.log('Token Account Equal:', tokenAccounts.length, '&', newTokenAccounts.length, ':' , checkTokenAccountsEqual(tokenAccounts, newTokenAccounts));


  // Check if node auth data are equal
  let nodeData = await getNodeData(providerSyncFrom);
  let newNodeData = await getNodeData(providerSyncTo);
  console.log('Node Auth Equal:', nodeData.length, '&', newNodeData.length, ':', checkNodeAuthsEqual(nodeData, newNodeData));

  // Check if council data are equal
  let {prime, members, proposals} = await getCouncilData(providerSyncFrom);
  let {prime: newPrime, members: newMembers, proposals: newProposals} = await getCouncilData(providerSyncTo);
  console.log('Council Members Equal:', members.length, '&', newMembers.length, ':' , checkIfMembersPrimeEqual({prime, members}, {newPrime, newMembers}));
  console.log('Council Proposals Equal:', proposals.length, '&', newProposals.length, ':' , checkIfProposalsEqual(proposals, newProposals));

  console.log('Finished Sync');
}

main();
