import { Keyring } from '@polkadot/api';
import { createConnection, sleep } from './src/helper/utils';
import { transaction } from 'mui-metablockchain-sdk';
import { storeDIDOnChain, sendTransaction } from './src/helper/did';

async function ddos(provider) {
  const keyring = new Keyring({ type: 'sr25519' });
  const rootKeyPairAlice = await keyring.addFromUri('//Alice');
  const rootKeyPairBob = await keyring.addFromUri('//Bob');
  let aliceDid = 'did:ssid:swn';
  let bobDid = 'did:ssid:swn2';
  let didObj = {
    public_key: rootKeyPairBob.address,
    identity: bobDid,
    metadata: '',
  };
  try {
    await storeDIDOnChain(didObj, rootKeyPairAlice, provider, -1);
    await transaction.sendTransaction(rootKeyPairAlice, bobDid, '10000000000', provider, -1);
  } catch(e) {}
  let i = 0;
  let nonceAlice = await provider.rpc.system.accountNextIndex(rootKeyPairAlice.address);
  let nonceBob = await provider.rpc.system.accountNextIndex(rootKeyPairBob.address);
  let promises = [];
  while (i < 100000) {
    let alicePromise = sendTransaction(rootKeyPairAlice, bobDid, '100', provider, nonceAlice);
    let bobPromise = sendTransaction(rootKeyPairBob, aliceDid, '100', provider, nonceBob);
    i++;
    nonceAlice++;
    nonceBob++;
    promises.push(
      alicePromise,
      bobPromise
    );
  }
  try {
    await Promise.all(promises);
  } catch(e) {
    console.log(e);
  }
}

async function main() {
  const nodeUrl = 'ws://localhost:9944';
  const provider: any = await createConnection(nodeUrl);
  ddos(provider);
}

main();