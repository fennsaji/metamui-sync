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


async function syncDidAccounts(latestAccounts, providerSyncTo, rootKeyPair, nonce) {
  try {
    let didCreateErrorObjects = [];

    const keyring = new Keyring({ type: 'sr25519' });

    let didPromises = [];
    const txs = [];

    for (let i = 0; i < latestAccounts.length; i++) {
      let acc = latestAccounts[i];
      let didObj = {
        public_key: keyring.decodeAddress(acc.accountId),
        identity: acc.did,
        metadata: acc.metadata,
      };
      txs.push(
        providerSyncTo.tx.did.add(didObj.public_key, did.sanitiseDid(didObj.identity), didObj.metadata)
      );
      didPromises.push(
        storeDIDOnChain(didObj, rootKeyPair, providerSyncTo, nonce)
          .catch(err => {
            didCreateErrorObjects.push({ error: err, account: acc });
            console.log('Sync Acc Did Error:', acc, err);
            return err;
          })
      );
      nonce = +nonce + 1;
    }
    try {
      // await storeDIDOnChain(txs, rootKeyPair, providerSyncTo, nonce);
      await Promise.all(didPromises.map(p => p.catch(e => e)));
    } catch (e) {
      console.log(e);
    }

  } catch (error) {
    console.log(error);
  }
}

async function syncDidAccountsBalance(latestAccounts, providerSyncTo, rootKeyPair, nonce) {
  try {
    let setBalanceErrorObjects = [];

    let didsWithAccId = (await Promise.all(latestAccounts.map(async acc => ({
      ...acc,
      accountId: await did.resolveDIDToAccount(acc.did, providerSyncTo),
    })))).filter(acc => !!acc.accountId);

    let setBalPromises = [];
    for (let i = 0; i < didsWithAccId.length; i++) {
      let acc = didsWithAccId[i];
      setBalPromises.push(
        setBalance(acc.accountId, acc.value.data.free, acc.value.data.reserved, rootKeyPair, providerSyncTo, nonce)
          .catch(err => {
            setBalanceErrorObjects.push({ error: err, account: acc });
            console.log('Sync Acc Balance Error:', acc, err);
            return err;
          })
      );
      nonce = +nonce + 1;
    }
    try {
      await Promise.all(setBalPromises.map(p => p.catch(e => e)));
    } catch (e) {
      console.log(e);
    }

  } catch (error) {
    console.log(error);
  }
}


async function syncDids(providerSyncFrom, providerSyncTo, rootKeyPair, nonce) {

  const nodeOneDids = await getDidAccountsSnapshot('./src/data/didNodeOne.json', providerSyncFrom);
  await syncDidAccounts(nodeOneDids, providerSyncTo, rootKeyPair, nonce);
  nonce+=nodeOneDids.length;
  syncDidAccountsBalance(nodeOneDids, providerSyncTo, rootKeyPair, nonce);
  nonce+=nodeOneDids.length;
  console.log('Did Sync Completed');
  return nonce;
  // const nodeTwoDids = await getDidAccountsSnapshot('./src/data/didNodeTwo.json', providerSyncTo);

  // const devDids = JSON.parse(fs.readFileSync('devDids.json', 'utf-8'));
  // const nodeTwoDids = JSON.parse(fs.readFileSync('nodeTwoDids.json', 'utf-8'));

  // let errorDids = checkDidsEqual(nodeOneDids, nodeTwoDids);
  // console.log(errorDids);
}


export {
  syncDids,
}