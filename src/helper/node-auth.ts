import { connection, did, transaction, utils, token, vc } from 'mui-metablockchain-sdk';

async function getWellKnownNodes(provider) {
  return (await provider.query.nodeAuthorization.wellKnownNodes());
}

async function getNodeData(provider) {
  return Promise.all((await provider.query.nodeAuthorization.owners.entries())
    .map(async ([{args: [peerId]}, value]) => {
      let connections = await getAdditionalConnections(peerId, provider);
      return {peerId: peerId.toHuman(), did: value.toHuman(), connections: connections.toHuman()}
    }));
}

async function getAdditionalConnections(peerId, provider) {
  return (await provider.query.nodeAuthorization.additionalConnections(peerId));
}

async function addWellKnownNode(
  peerId,
  owner,
  senderAccountKeyPair,
  api = false,
  nonce,
) {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = api || (await connection.buildConnection('local'));
      const tx = provider.tx.sudo.sudo(provider.tx.nodeAuthorization.addWellKnownNode(
        peerId,
        owner,
      ));
      nonce = nonce ?? await provider.rpc.system.accountNextIndex(senderAccountKeyPair.address);
      let signedTx = tx.sign(senderAccountKeyPair, { nonce });
      await signedTx.send(function ({ status, dispatchError, events }) {
          events
            .forEach(({ event: { data: [result] } }) => {
              if (result.isError) {
                let error = result.asError;
                if (error.isModule) {
                  const decoded = provider.registry.findMetaError(error.asModule);
                  const { docs, name, section } = decoded;
                  reject(new Error(`${section}.${name}`));
                } else {
                  reject(new Error(error.toString()));
                }
              }
            });
        if (dispatchError) {
          reject(new Error(dispatchError.toString()));
        } else if (status.isReady) {
          resolve(signedTx.hash.toHex())
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}


async function addConnections(
  peerId,
  connections,
  senderAccountKeyPair,
  api = false,
  nonce,
) {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = api || (await connection.buildConnection('local'));
      const tx = provider.tx.nodeAuthorization.addConnections(
        peerId,
        connections,
      );
      nonce = nonce ?? await provider.rpc.system.accountNextIndex(senderAccountKeyPair.address);
      let signedTx = tx.sign(senderAccountKeyPair, { nonce });
      await signedTx.send(function ({ status, dispatchError, events }) {
          events
            .forEach(({ event: { data: [result] } }) => {
              if (result.isError) {
                let error = result.asError;
                if (error.isModule) {
                  // for module errors, we have the section indexed, lookup
                  const decoded = provider.registry.findMetaError(error.asModule);
                  const { docs, name, section } = decoded;

                  reject(new Error(`${section}.${name}`));
                } else {
                  // Other, CannotLookup, BadOrigin, no extra info
                  reject(new Error(error.toString()));
                }
              }
            });
        if (dispatchError) {
          reject(new Error(dispatchError.toString()));
        } else if (status.isReady) {
          resolve(signedTx.hash.toHex())
        }
      });
    } catch (err) {
      // console.log(err);
      reject(err);
    }
  });
}

function checkNAEqual(nodeA, nodeB) {
  let flag = true;
  if (nodeA.did != nodeB.did) {
    flag = false;
  }
  if (nodeA.connections.length != nodeB.connections.length) {
    flag = false;
  }
  nodeA.connections.forEach(nodeAConnection => {
    if(!nodeB.connections.includes(nodeAConnection)) {
      flag = false;
    }
  })
  return flag;
}

function checkNodeAuthsEqual(nodeAPeerDatas, nodeBPeerDatas) {
  let flag = true;
  nodeAPeerDatas.forEach(nodeA => {
    let nodeB: any = nodeBPeerDatas.find((t: any) => (t.peerId == nodeA.peerId));
    if (!nodeB) {
      flag = false;
      console.log('Undefined B', nodeA, nodeB);
      return;
    }
    if (!checkNAEqual(nodeA, nodeB)) {
      flag = false;
      console.log('Not Equal', nodeA, nodeB);
    }
  });
  return flag;
}

export {
  getWellKnownNodes,
  getNodeData,
  getAdditionalConnections,
  addWellKnownNode,
  addConnections,
  checkNodeAuthsEqual,
}