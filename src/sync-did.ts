import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';
import * as fs from 'fs';
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import * as _ from 'lodash';
import { bytesToString, checkDidsEqual, METABLOCKCHAIN_TYPES } from './helper/utils';
import { setBalance } from './helper/balance';


async function getAllAccountInfo(api = false, hash = null) {
  const provider = api || (await connection.buildConnection('local'));
  const dids = (await provider.query.did.dIDs.entries())
    .map(([{ args: [did] }, value]) => {
      return { did, value: value.toJSON()[0] };
    });
  if (!hash) {
    return Promise.all(dids.map(async obj => {
      return {
        did: bytesToString(obj.did),
        accountId: (await did.resolveDIDToAccount(bytesToString(obj.did), provider)),
        metadata: obj.value.metadata,
        value: (await provider.query.did.account(obj.did)).toJSON(),
      };
    }));
  }
  return Promise.all(dids.map(async obj => {
    return {
      did: bytesToString(obj.did),
      accountId: (await provider.query.did.lookup.at(hash, obj.did)).toJSON(),
      metadata: obj.value.metadata,
      value: (await provider.query.did.account.at(hash, obj.did)).toJSON(),
    };
  }));
}


async function getDidAccountsSnapshot(filePath, wsUrl) {
  // Create Connection to substrate node and fetch Data
  const provider = new WsProvider(wsUrl);
  const providerSyncFrom: any = await ApiPromise.create({
    provider,
    types: METABLOCKCHAIN_TYPES,
  });
  const latestAccounts = await getAllAccountInfo(providerSyncFrom);
  const blockHash = await providerSyncFrom.rpc.chain.getBlockHash(0);
  const accountsAtFirstBlock = await getAllAccountInfo(providerSyncFrom, blockHash);

  fs.writeFileSync(filePath, JSON.stringify(latestAccounts), 'utf-8');
  return latestAccounts;
}


async function syncDidAccountsSnapshot(filePath, wsUrl) {
  let didCreateErrorObjects = [];
  let setBalanceErrorObjects = [];
  let latestAccounts = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log('Total Accounts:', latestAccounts.length);
  // Sync fetched data to
  const provider = new WsProvider(wsUrl);
  const providerSyncTo = await ApiPromise.create({
    provider,
    types: METABLOCKCHAIN_TYPES,
  });

  const keyring = new Keyring({ type: 'sr25519' });
  const rootKeyPair = await keyring.addFromUri('//Alice');
  for (let i = 0; i < latestAccounts.length; i++) {
    let acc = latestAccounts[i];
    console.log('Sync Acc no:', i + 1);
    console.log('Sync Acc Data:', acc);
    let didObj = {
      public_key: keyring.decodeAddress(acc.accountId),
      identity: acc.did,
      metadata: acc.metadata,
    };
    try {
      await did.storeDIDOnChain(didObj, rootKeyPair, providerSyncTo);
    } catch (err) {
      didCreateErrorObjects.push({ error: err, account: acc });
      console.log(err);
    }
    try {
      await setBalance(acc.did, acc.value.data.free, acc.value.data.reserved, rootKeyPair, providerSyncTo);
    } catch (err) {
      setBalanceErrorObjects.push({ error: err, account: acc });
      console.log(err);
    }
  }
  fs.writeFileSync('createAccErr_' + filePath, JSON.stringify(didCreateErrorObjects), 'utf-8');
  fs.writeFileSync('setBalErr_' + filePath, JSON.stringify(setBalanceErrorObjects), 'utf-8');
}


async function syncDids(syncFromUrl, syncToUrl) {

  const devDids = await getDidAccountsSnapshot('data/didNodeOne.json', syncFromUrl);
  await syncDidAccountsSnapshot('data/didNodeOne.json', syncToUrl);
  const localDids =  await getDidAccountsSnapshot('data/didNodeTwo.json', syncToUrl);

  // const devDids = JSON.parse(fs.readFileSync('devDids.json', 'utf-8'));
  // const localDids = JSON.parse(fs.readFileSync('localDids.json', 'utf-8'));

  checkDidsEqual(devDids, localDids);
}


export {
  syncDids,
}