import { connection, did, transaction, utils, token, vc } from 'mui-metablockchain-sdk';
import { checkTokenAccountsEqual, getTokenAccounts, issueToken, setBalance } from './helper/token';
import * as _ from 'lodash';

async function getSupplyAndIssueToken(
  vcId,
  totalIssuance,
  sudoKeyPair,
  providerSyncTo,
  nonce
) {
  try {
    await issueToken(
      vcId,
      totalIssuance,
      sudoKeyPair,
      providerSyncTo,
      nonce
    );
  } catch(err) {
    throw err;
  }
}

async function syncTokenData(tokenAccounts, sudoKeyPair, providerSyncFrom, providerSyncTo) {
  let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(sudoKeyPair.address)).toJSON();
  let tokenIssuePromises = [];
  for (let i = 0; i < tokenAccounts.length; i++) {
    let { vcId, tokenData, totalIssuance } = tokenAccounts[i];
    if(!vcId) {
      continue;
    }
    tokenIssuePromises.push(getSupplyAndIssueToken(
      vcId,
      totalIssuance,
      sudoKeyPair,
      providerSyncTo,
      nonce
    ).catch(e => {
      console.log(vcId.toString(), tokenData.currency_code, e);
    }));
    nonce = +nonce + 1;
  }
  const data = await Promise.all(tokenIssuePromises.map(p => p.catch(e => e)));
  console.log(data.filter(d => !!d));
}

async function syncTokenUserBalances(tokenAccounts, sudoKeyPair, providerSyncTo) {
  let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(sudoKeyPair.address)).toJSON();
  let tokenIssuePromises = [];
  for (let i = 0; i < tokenAccounts.length; i++) {
    let { did, currencyCode, value, tokenIssuer, totalIssuance } = tokenAccounts[i];
    let freeBalance = value?.data?.free;
    if(!currencyCode || currencyCode == '' || did == tokenIssuer) {
      continue;
    }
    if(freeBalance && freeBalance > totalIssuance) {
      console.log('Total Issuance less', did, currencyCode, freeBalance, totalIssuance);
    }
    tokenIssuePromises.push(setBalance(
      did,
      currencyCode,
      freeBalance,
      sudoKeyPair,
      providerSyncTo,
      nonce
    ).catch(e => {
      console.log(did, currencyCode, freeBalance, e);
    }));
    nonce = +nonce + 1;
  }
  await Promise.all(tokenIssuePromises.map(p => p.catch(e => e)));
}

async function syncTokens(addedTokenVCs, providerSyncFrom, providerSyncTo, rootKeyPair) {

  // Get TokensData
  let tokenAccounts = (await getTokenAccounts(providerSyncFrom)).filter(ta => ta?.tokenData?.currency_code);

  // merge token accounts and vcs
  tokenAccounts = tokenAccounts.map(ta => {
    let vc = addedTokenVCs.find(vc => {
      let dec_cc = utils.hexToString(vc.currency_code);
      return ta.tokenData.currency_code == dec_cc;
    });
    if (!vc) {
      return { ...ta };
    }
    return { ...ta, vcId: vc.newVcId, vcData: vc };
  })

  let issuedTokens = _.uniqBy(tokenAccounts, function (ta) {
    return ta.tokenData.currency_code;
  });

  // Sync data
  await syncTokenData(issuedTokens, rootKeyPair, providerSyncFrom, providerSyncTo);

  await syncTokenUserBalances(tokenAccounts, rootKeyPair, providerSyncTo);

  console.log('Tokens Sync Completed');

  
}

export {
  syncTokens,
}