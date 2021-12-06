import { checkVCsEqual, getVCs, storeVC } from "./helper/vc";
import { connection, did, transaction, utils, token, vc } from 'mui-metablockchain-sdk';


async function storeTokenVCs(vcs, rootKeyPair, provider, nonce) {
  let addedVCs = [];
  let vcPromises = [];
  for(let i = 0; i < vcs.length; i++) {
    let vcData = {...vcs[i]};
    if(vcData.vc_type == 'TokenVC') {
      if(vcData.is_vc_used) {
        addedVCs.push(vcData);
      }
      vcData.is_vc_used = false;
      let addedVc = utils.encodeData(vcData, 'VC');
      vcPromises.push(storeVC(addedVc, rootKeyPair, provider, nonce));
      nonce = +nonce + 1;
    }
  }
  await Promise.all(vcPromises.map(p => p.catch(e => e)));
  return addedVCs;
}

async function storeOtherVCs(vcs, rootKeyPair, provider, nonce) {
  let vcPromises = [];
  for(let i = 0; i < vcs.length; i++) {
    let vcData = vcs[i];
    if(vcData.vc_type !== 'TokenVC') {
      let addedVc = utils.encodeData(vcData, 'VC');
      vcPromises.push(storeVC(addedVc, rootKeyPair, provider, nonce));
      nonce = +nonce + 1;
    }
  }
  await Promise.all(vcPromises.map(p => p.catch(e => e)));
}


async function syncVcs(providerSyncFrom, providerSyncTo, rootKeyPair) {
  let vcs = await getVCs(providerSyncFrom);

  let nonce: any = +((await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON());

  let addedVCs = await storeTokenVCs(vcs, rootKeyPair, providerSyncTo, nonce);
  console.log(addedVCs);

  nonce = +((await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON());

  storeOtherVCs(vcs, rootKeyPair, providerSyncTo, nonce);

  let newVcs = await getVCs(providerSyncTo);

  // vcs = await getVCs(providerSyncFrom);

  // console.log('VCS Equal', newVcs.length, vcs.length, checkVCsEqual(vcs, newVcs));
  console.log('VCs sync completed');

  return addedVCs.map(vc => {
    let currency_code = utils.decodeHex(vc.vc_property, vc.vc_type).currency_code;
    let newVc = newVcs.find(newVc => {
      if(newVc.vc_type != 'TokenVC') {
        return false;
      }
      let ccy_code = utils.decodeHex(newVc.vc_property, newVc.vc_type).currency_code;
      return currency_code == ccy_code;
    });
    return {...vc, newVcId: newVc.vcId, currency_code};
  });
}

export {
  syncVcs,
}