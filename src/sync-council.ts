import { connection, did, transaction, utils ,collective } from 'mui-metablockchain-sdk';
import { getCouncilData, propose, setMembers } from './helper/council';

async function syncCouncil(providerSyncFrom, providerSyncTo, rootKeyPair) {
  let {prime, members, proposals} = await getCouncilData(providerSyncFrom);
 
  await setMembers(members, prime, 0, rootKeyPair, providerSyncTo);
  let promises = [];
  let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON();

  for (let i = 0; i < proposals.length; i++) {
    const proposal = proposals[i].proposal;
    let call = providerSyncTo.tx[proposal['section']][proposal['method']](...proposal.args);
    promises.push(
      propose(3, call, 1000, rootKeyPair, providerSyncTo, nonce)
      .catch(e => {
        console.log('Propose Error:', {proposal, e});
      })
    );
    
    nonce = +nonce + 1;
  }

  await Promise.all(promises);
  console.log('Council Pallet Sync Completed');
}

export {
  syncCouncil,
}