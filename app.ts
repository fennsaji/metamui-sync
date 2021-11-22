import { syncDids } from "./src/sync-did";

async function main() {

  const filePath = 'didAccounts.json';
  const localUrl = 'ws://127.0.0.1:9944';
  const devUrl = 'wss://n3testnet.metabit.exchange';
  const testnetUrl = 'wss://n2testnet.metabit.exchange';
  const newNodeUrl = 'wss://n4testnet.metabit.exchange';


  // Sync Did from one node to another
  await syncDids(devUrl, localUrl);
}

main();