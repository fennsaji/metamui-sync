import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';
import * as fs from 'fs';
import { Keyring } from '@polkadot/api';
import * as _ from 'lodash';
import { bytesToString, checkDidsEqual, METABLOCKCHAIN_TYPES, sleep } from './helper/utils';
import { setBalance } from './helper/balance';
import { storeDIDOnChain } from './helper/did';


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


async function getDidAccountsSnapshot(filePath, providerSyncFrom) {
  const latestAccounts = await getAllAccountInfo(providerSyncFrom);
  const blockHash = await providerSyncFrom.rpc.chain.getBlockHash(0);
  const accountsAtFirstBlock = await getAllAccountInfo(providerSyncFrom, blockHash);

  fs.writeFileSync(filePath, JSON.stringify(latestAccounts), 'utf-8');
  return latestAccounts;
}


async function syncDidAccounts(latestAccounts, providerSyncTo, rootKeyPair) {
  try {
    let didCreateErrorObjects = [];
    console.log('Total Accounts:', latestAccounts.length);

    const keyring = new Keyring({ type: 'sr25519' });

    let didPromises = [];

    let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON();
    for (let i = 0; i < latestAccounts.length; i++) {
      let acc = latestAccounts[i];
      console.log('Sync Acc Did no:', i + 1);
      console.log('Sync Acc Data:', acc);
      let didObj = {
        public_key: keyring.decodeAddress(acc.accountId),
        identity: acc.did,
        metadata: acc.metadata,
      };
      didPromises.push(
        storeDIDOnChain(didObj, rootKeyPair, providerSyncTo, nonce)
          .catch(err => {
            didCreateErrorObjects.push({ error: err, account: acc });
            return err;
          })
      );
      nonce = +nonce + 1;
    }
    try {
      await Promise.all(didPromises.map(p => p.catch(e => e)));
    } catch (e) {
      console.log(e);
    }

    console.log('Stored data success');
    fs.writeFileSync('./src/data/creatDidErr.json', JSON.stringify(didCreateErrorObjects), 'utf-8');
    console.log('Successfull')

  } catch (error) {
    console.log(error);
  }
}

async function syncDidAccountsBalance(latestAccounts, providerSyncTo, rootKeyPair) {
  try {
    let setBalanceErrorObjects = [];
    console.log('Total Accounts:', latestAccounts.length);

    let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON();

    let didsWithAccId = (await Promise.all(latestAccounts.map(async acc => ({
      ...acc,
      accountId: await did.resolveDIDToAccount(acc.did, providerSyncTo),
    })))).filter(acc => !!acc.accountId);

    let setBalPromises = [];
    for (let i = 0; i < didsWithAccId.length; i++) {
      let acc = didsWithAccId[i];
      console.log('Sync Acc Balance no:', i + 1);
      console.log('Sync Acc Data:', acc);
      setBalPromises.push(
        setBalance(acc.accountId, acc.value.data.free, acc.value.data.reserved, rootKeyPair, providerSyncTo, nonce)
          .catch(err => {
            setBalanceErrorObjects.push({ error: err, account: acc });
            return err;
          })
      );
      nonce = +nonce + 1;
    }
    try {
      const data = await Promise.all(setBalPromises.map(p => p.catch(e => e)));
    } catch (e) {
      console.log(e);
    }

    console.log('Stored data success');
    fs.writeFileSync('./src/data/setBalErr.json', JSON.stringify(setBalanceErrorObjects), 'utf-8');
    console.log('Successfull')

  } catch (error) {
    console.log(error);
  }
}


async function syncDids(providerSyncFrom, providerSyncTo, rootKeyPair) {

  const nodeOneDids = await getDidAccountsSnapshot('./src/data/didNodeOne.json', providerSyncFrom);
  await syncDidAccounts(nodeOneDids, providerSyncTo, rootKeyPair);
  await syncDidAccountsBalance(nodeOneDids, providerSyncTo, rootKeyPair);
  const nodeTwoDids = await getDidAccountsSnapshot('./src/data/didNodeTwo.json', providerSyncTo);

  // const devDids = JSON.parse(fs.readFileSync('devDids.json', 'utf-8'));
  // const nodeTwoDids = JSON.parse(fs.readFileSync('nodeTwoDids.json', 'utf-8'));

  let errorDids = checkDidsEqual(nodeOneDids, nodeTwoDids);
  console.log(errorDids);
}


export {
  syncDids,
}