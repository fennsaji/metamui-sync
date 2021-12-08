import { connection, did, transaction, utils, token, vc } from 'mui-metablockchain-sdk';
import { checkTokenAccountsEqual, getTokenAccounts, issueToken } from './helper/token';
import * as _ from 'lodash';

async function getSupplyAndIssueToken(
  vcId,
  currencyCode,
  sudoKeyPair,
  providerSyncTo,
  providerSyncFrom,
  nonce
) {
  try {
    let totalIssuance = await token.getTokenTotalSupply(currencyCode, providerSyncFrom);
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
    let { vcId, tokenData } = tokenAccounts[i];
    if(!vcId) {
      continue;
    }
    tokenIssuePromises.push(getSupplyAndIssueToken(
      vcId,
      tokenData.currency_code,
      sudoKeyPair,
      providerSyncTo,
      providerSyncFrom,
      nonce
    ).catch(e => {
      console.log(vcId.toString(), tokenData.currency_code, e);
    }));
    nonce = +nonce + 1;
  }
  const data = await Promise.all(tokenIssuePromises.map(p => p.catch(e => e)));
  console.log(data.filter(d => !!d));
}

async function syncTokens(addedTokenVCs, providerSyncFrom, providerSyncTo, rootKeyPair) {

  // Get TokensData
  let tokenAccounts = (await getTokenAccounts(providerSyncFrom)).filter(ta => ta?.tokenData?.currency_code);

  // merge token accounts and vcs
  tokenAccounts = tokenAccounts.map(ta => {
    let vc = addedTokenVCs.find(vc => {
      let dec_cc = utils.hexToString(vc.currency_code);
      return ta.tokenData.currency_code == dec_cc;
    })
    if (!vc) {
      return { ...ta };
    }
    return { ...ta, vcId: vc.newVcId, vcData: vc };
  })

  tokenAccounts = _.uniqBy(tokenAccounts, function (ta) {
    return ta.tokenData.currency_code;
  });

  // Sync data
  await syncTokenData(tokenAccounts, rootKeyPair, providerSyncFrom, providerSyncTo);

  console.log('Tokens Sync Completed');

  
}

export {
  syncTokens,
}