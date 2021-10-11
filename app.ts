import { connection, did, utils, token, transaction, balance} from 'mui-metablockchain-sdk';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
import { addNewDid, removeDid } from './modules/did';
import { getBalance, transfer, transferWithMemo } from './modules/balance';

const aliceDid = 'did:ssid:swn';

const testDid = {
  "identity" : "did:ssid:fenn",
  "public_key" : "5CA8uxffSzq2JyXVKXBudbgC3zBkQGzH2WUUf8ogBiJzxvFJ",
  "metadata" : " "
}

console.log(did.sanitiseDid(testDid.identity))

async function testModules() {
  const provider = await connection.buildConnection('local', true);
  let aliceBalance = await getBalance(aliceDid, provider);
  console.log('Alice Balance:', aliceBalance);

  await addNewDid(testDid, provider);
  let fennBalance = await getBalance(testDid.identity, provider);
  console.log('Fenn Balance:', fennBalance);

  await transfer(testDid.identity, 10000000, provider);
  aliceBalance = await getBalance(aliceDid, provider);
  console.log('Alice Balance:', aliceBalance);
  fennBalance = await getBalance(testDid.identity, provider);
  console.log('Fenn Balance:', fennBalance);

  await transferWithMemo(testDid.identity, 20000000, 'Test', provider);
  aliceBalance = await getBalance(aliceDid, provider);
  console.log('Alice Balance:', aliceBalance);
  fennBalance = await getBalance(testDid.identity, provider);
  console.log('Fenn Balance:', fennBalance);

  await removeDid(testDid.identity, provider);
}

testModules();