import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { createConnection, sleep } from "./src/helper/utils";
import { syncDids } from "./src/sync-dids";
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

  // Sync validators
  nonce = await syncValidators(providerSyncFrom, providerSyncTo, rootKeyPair, nonce);
  // await sleep(5000);
  // // Sync VC Pallet
  // let addedVCs = await syncVcs(providerSyncFrom, providerSyncTo, rootKeyPair);
  // await sleep(5000);
  // await syncTokens(addedVCs, providerSyncFrom, providerSyncTo, rootKeyPair);

}

main();