import { Keyring } from "@polkadot/api";
import { createConnection } from "./src/helper/utils";
import { syncDids } from "./src/sync-dids";
import { syncTokens } from "./src/sync-tokens";
import { syncValidators } from "./src/sync-validator-set";

async function main() {
  const localUrl = 'ws://127.0.0.1:9944';
  const devUrl = 'wss://n3testnet.metabit.exchange';
  const testnetUrl = 'wss://n2testnet.metabit.exchange';
  const newNodeUrl = 'wss://n4testnet.metabit.exchange';

  let syncFromUrl = devUrl;
  let syncToUrl = localUrl;

  const providerSyncFrom: any = createConnection(syncFromUrl)
  const providerSyncTo: any = createConnection(syncToUrl)


  const keyring = new Keyring({ type: 'sr25519' });
  const rootKeyPair = await keyring.addFromUri('//Alice');

  // Sync Did from one node to another
  await syncDids(providerSyncFrom, providerSyncTo, rootKeyPair);

  // Sync validators
  await syncValidators(providerSyncFrom, providerSyncTo, rootKeyPair);

  // Sync VC Pallet
  // await syncTokens()


}

main();