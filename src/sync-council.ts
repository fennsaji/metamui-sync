import { connection, did, transaction, utils ,collective } from 'mui-metablockchain-sdk';
import { getCouncilData, propose, setMembers } from './helper/council';

async function syncCouncil(providerSyncFrom, providerSyncTo, rootKeyPair) {
  let {prime, members, proposals} = await getCouncilData(providerSyncFrom);
  if(!members.includes(did.sanitiseDid('did:ssid:swn'))) {
    members.push(did.sanitiseDid('did:ssid:swn'));
  }
  await setMembers(members, prime, 0, rootKeyPair, providerSyncTo);
  let promises = [];
  let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(rootKeyPair.address)).toJSON();

  for (let i = 0; i < proposals.length; i++) {
    const proposal = proposals[i].proposal;
    promises.push(
      propose(3, proposal, 1000, rootKeyPair, providerSyncTo, nonce)
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