import { getWellKnownNodes, getAdditionalConnections, getNodeData, addWellKnownNode, addConnections } from './helper/node-auth';

async function syncNodeAuths(providerSyncFrom, providerSyncTo, sudoKeyPair) {
  let nodeData = await getNodeData(providerSyncFrom);
  let nonce: any = (await providerSyncTo.rpc.system.accountNextIndex(sudoKeyPair.address)).toJSON();
  let promises = [];
  let connectionPromises = [];
  for (let i = 0; i < nodeData.length; i++) {
    let { peerId, did, connections } = nodeData[i];
    promises.push(addWellKnownNode(
      peerId,
      did,
      sudoKeyPair,
      providerSyncTo,
      nonce,
    ).catch(e => {
      console.log('Add Well Known Node:', { did, peerId, e });
    }));
    nonce = +nonce + 1;
    if (connections && connections.length > 0) {
      connectionPromises.push(addConnections(
        peerId,
        connections,
        sudoKeyPair,
        providerSyncTo,
        nonce,
      ).catch(e => {
        console.log('Add Connections', { did, peerId, e });
      }));
      nonce = +nonce + 1;
    }
  }
  await Promise.all(promises.map(p => p.catch(e => e)));
  await Promise.all(connectionPromises.map(p => p.catch(e => e)));
  console.log('Node Auth Sync Completed');
}

export {
  syncNodeAuths,
}