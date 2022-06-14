import { Keyring } from '@polkadot/api';
import { storeDIDOnChain } from './src/helper/did';
import { addWellKnownNode } from './src/helper/node-auth';
import { addNodeValidator } from './src/helper/node-validator';
import { addSessionKeys } from './src/helper/sessions';
import { createConnection, sleep } from './src/helper/utils';

async function addKey(node, {suri, aura, gran}) {
  await node.rpc.author.insertKey('aura', suri, aura.key);
  await node.rpc.author.insertKey('gran', suri, gran.key);
}

async function addNodeOneAliceKeys() {
  const nodeOneUrl = 'ws://127.0.0.1:9944';
  const nodeOne = await createConnection(nodeOneUrl);
  let nodeOneKeys = {
    suri: '//Alice',
    aura: {
      key: '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
    },
    gran: {
      key: '0x88dc3417d5058ec4b4503e0c12ea1a0a89be200fe98922423d4334014fa6b0ee'
    },
  }
  await addKey(nodeOne, nodeOneKeys);

}

async function addNodeOneBobKeys() {
  const nodeOneUrl = 'ws://127.0.0.1:9944';
  const nodeOne = await createConnection(nodeOneUrl);
  let nodeOneKeys = {
    suri: '//Bob',
    aura: {
      key: '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
    },
    gran: {
      key: '0x88dc3417d5058ec4b4503e0c12ea1a0a89be200fe98922423d4334014fa6b0ee'
    },
  }
  await addKey(nodeOne, nodeOneKeys);

}

async function addNodeOneKeys() {
  const nodeOneUrl = 'ws://127.0.0.1:9944';
  const nodeOne = await createConnection(nodeOneUrl);
  let nodeOneKeys = {
    suri: 'disease clutch curve pill nose intact mosquito refuse rural increase month hollow',
    aura: {
      key: '0x6eb5e9edfa9a12110c39fcb6577c37b8b0d85fec9fd556323ec38d44af3f407a'
    },
    gran: {
      key: '0x852e91791bcb826183a13f730944e37f1219f92632f6a939f492fb609fc7d6e5'
    },
  }
  await addKey(nodeOne, nodeOneKeys);

}

async function addNodeTwoKeys() {
  const nodeTwoUrl = 'ws://127.0.0.1:9945';
  const nodeTwo = await createConnection(nodeTwoUrl);
  let nodeTwoKeys = {
    suri: 'fault ethics tank electric perfect inspire quiz unlock inch slide mom account',
    aura: {
      key: '0x3a9fff3761adf9e48b29a690fd9f339fae65572e62560a23c2de64f522f29517'
    },
    gran: {
      key: '0x831826ba75facbf0d966f59a8c52262972a0318df4becab7011155698df9e509'
    },
  }
  await addKey(nodeTwo, nodeTwoKeys);
}

async function addNodeThreeKeys() {
  const nodeThreeUrl = 'ws://127.0.0.1:9946';
  const nodeThree = await createConnection(nodeThreeUrl);
  let nodeThreeKeys = {
    suri: 'multiply shell noble exact uniform express real load icon cricket suggest escape',
    aura: {
      key: '0xa8f35e0a2c63d03a8d49e00fa610a707613361d43bbdeadf760415be6230401f'
    },
    gran: {
      key: '0xa7915ca7703c657ab610c0442b7aa517c0fa54ce476aea5abd03133c5da9c1ba'
    },
  }
  await addKey(nodeThree, nodeThreeKeys);
}

async function addNodeFourKeys() {
  const nodeFourUrl = 'ws://127.0.0.1:9947';
  const nodeFour = await createConnection(nodeFourUrl);
  let nodeFourKeys = {
    suri: 'team thumb scene clay list fire motor case evolve false genuine axis',
    aura: {
      key: '0xfa614e3c4ba1cc27577654b7c1aa9e04fec8cc39edb19a705b6ef9b930bfc76f'
    },
    gran: {
      key: '0x5bd2d2a3a758aad188602099b0c5a1bb08add6c01ba7454113ca49af43e683ee'
    },
  }
  await addKey(nodeFour, nodeFourKeys);
}

async function addNodeFiveKeys() {
  const nodeFiveUrl = 'ws://127.0.0.1:9948';
  const nodeFive = await createConnection(nodeFiveUrl);
  let nodeFiveKeys = {
    suri: 'symbol accident heart toss time fiber canyon ring shuffle peasant thrive indoor',
    aura: {
      key: '0x7cd9c7362bd3f59c913c102a9475c4ed09ef23bf3fcd4f4d65c410dc7a20182d'
    },
    gran: {
      key: '0x0a65ca62382e92f65c5068b0c679873628b90525a479e6393a36c5da7190f769'
    },
  }
  await addKey(nodeFive, nodeFiveKeys);
}

async function addPeer(provider, rootKeyPair, didIdentity, nodeKey, publicKey) {
  let didObj = {
    public_key: publicKey,
    identity: didIdentity,
    metadata: ''
  };
  try {
    await storeDIDOnChain(didObj, rootKeyPair, provider, -1);
  } catch(e) {
    console.log(e);
  }
  try {
    await addWellKnownNode(nodeKey.decodedPeerId, didObj.identity, rootKeyPair, provider);
  } catch(e) {
    console.log(e);
  }
}

async function addValidator(newNodeUrl, seedPhrase, rootKeyPair) {
  const nodeProvider: any = await createConnection(newNodeUrl);
  const keyring = new Keyring({ type: 'sr25519' });
  const nodeKeyPair = await keyring.addFromUri(seedPhrase);
  let rotatedKeys = await nodeProvider.rpc.author.rotateKeys();
  try {
    await addSessionKeys(rotatedKeys, nodeKeyPair, nodeProvider);
    await addNodeValidator(nodeKeyPair.publicKey, rootKeyPair, nodeProvider);
  } catch(e) {
    console.log(e);
  }
}

async function addValidatorOne(rootKeyPair) {
  let nodeOneUrl = 'ws://127.0.0.1:9944';
  let nodeOneSeed = '//Alice';
  await addValidator(nodeOneUrl, nodeOneSeed, rootKeyPair);
}

async function addValidatorBobTwo(rootKeyPair) {
  let nodeOneUrl = 'ws://127.0.0.1:9945';
  let nodeOneSeed = '//Bob';
  await addValidator(nodeOneUrl, nodeOneSeed, rootKeyPair);
}

async function addValidatorTwo(provider, rootKeyPair) {
  let nodeTwoUrl = 'ws://127.0.0.1:9945';
  let nodeTwoSeed = 'fault ethics tank electric perfect inspire quiz unlock inch slide mom account';
  let nodeTwoDid = 'did:ssid:nodeTwo';
  let nodeTwoPkey = '0x3a9fff3761adf9e48b29a690fd9f339fae65572e62560a23c2de64f522f29517';
  let nodeTwoNodeKeys = {
    key: '6ce3be907dbcabf20a9a5a60a712b4256a54196000a8ed4050d352bc113f8c58',
    peerId: '12D3KooWQYV9dGMFoRzNStwpXztXaBUjtPqi6aU76ZgUriHhKust',
    decodedPeerId: '0x002408011220dacde7714d8551f674b8bb4b54239383c76a2b286fa436e93b2b7eb226bf4de7'
  }
  try {
    await addPeer(provider, rootKeyPair, nodeTwoDid, nodeTwoNodeKeys, nodeTwoPkey);
  } catch(e) {
    console.log(e);
  }
  try {
    await addValidator(nodeTwoUrl, nodeTwoSeed, rootKeyPair);
  } catch(e) {
    console.log(e);
  }
}

async function addValidatorThree(provider, rootKeyPair) {
  let nodeThreeUrl = 'ws://127.0.0.1:9946';
  let nodeThreeSeed = 'multiply shell noble exact uniform express real load icon cricket suggest escape';
  let nodeThreeDid = 'did:ssid:nodeThree';
  let nodeThreePkey = '0xa8f35e0a2c63d03a8d49e00fa610a707613361d43bbdeadf760415be6230401f';
  let nodeThreeNodeKeys = {
    key: '3a9d5b35b9fb4c42aafadeca046f6bf56107bd2579687f069b42646684b94d9e',
    peerId: '12D3KooWJvyP3VJYymTqG7eH4PM5rN4T2agk5cdNCfNymAqwqcvZ',
    decodedPeerId: '0x002408011220876a7b4984f98006dc8d666e28b60de307309835d775e7755cc770328cdacf2e'
  }
  try {
    await addPeer(provider, rootKeyPair, nodeThreeDid, nodeThreeNodeKeys, nodeThreePkey);
  } catch(e) {
    console.log(e);
  }
  try {
    await addValidator(nodeThreeUrl, nodeThreeSeed, rootKeyPair);
  } catch(e) {
    console.log(e);
  }
}

async function addValidatorFour(provider, rootKeyPair) {
  let nodeFourUrl = 'ws://127.0.0.1:9947';
  let nodeFourSeed = 'team thumb scene clay list fire motor case evolve false genuine axis';
  let nodeFourDid = 'did:ssid:nodeFour';
  let nodeFourKey = '0xfa614e3c4ba1cc27577654b7c1aa9e04fec8cc39edb19a705b6ef9b930bfc76f';
  let nodeFourNodeKeys = {
    key: 'a99331ff4f0e0a0434a6263da0a5823ea3afcfffe590c9f3014e6cf620f2b19a',
    peerId: '12D3KooWPHWFrfaJzxPnqnAYAoRUyAHHKqACmEycGTVmeVhQYuZN',
    decodedPeerId: '0x002408011220c81bc1d7057a1511eb9496f056f6f53cdfe0e14c8bd5ffca47c70a8d76c1326d'
  }
  try {
    await addPeer(provider, rootKeyPair, nodeFourDid, nodeFourNodeKeys, nodeFourKey);
  } catch(e) {
    console.log(e);
  }
  try {
    await addValidator(nodeFourUrl, nodeFourSeed, rootKeyPair);
  } catch(e) {
    console.log(e);
  }
}

async function addValidatorFive(provider, rootKeyPair) {
  let nodeFourUrl = 'ws://127.0.0.1:9948';
  let nodeFourSeed = 'symbol accident heart toss time fiber canyon ring shuffle peasant thrive indoor';
  let nodeFourDid = 'did:ssid:nodeFive';
  let nodeFourKey = '0x7cd9c7362bd3f59c913c102a9475c4ed09ef23bf3fcd4f4d65c410dc7a20182d';
  let nodeFourNodeKeys = {
    key: 'e49b64a499c7e34aa09619df67f49832db49d512a2b32c9bcf9360d3410c1c42',
    peerId: '12D3KooWJyZwW3oPaAQ1zaq8nSw45cxF5wag4hG8pzdkoTeEcAyk',
    decodedPeerId: '0x0024080112208814b84b0caec01345bb5764c2cb90f4051c1c25173de5c09fbbc28d61852507'
  }
  try {
    await addPeer(provider, rootKeyPair, nodeFourDid, nodeFourNodeKeys, nodeFourKey);
  } catch(e) {
    console.log(e);
  }
  try {
    await addValidator(nodeFourUrl, nodeFourSeed, rootKeyPair);
  } catch(e) {
    console.log(e);
  }
}

async function payoutStakers(era, keypair, provider, nonce=null) {
  return new Promise(async (resolve, reject) => {
    try {
      const tx = provider.tx.staking.payoutStakers(keypair.publicKey, era);
      nonce = nonce ?? await provider.rpc.system.accountNextIndex(keypair.address);
      let signedTx = tx.sign(keypair, { nonce });
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
      // console.log(err);
      reject(err);
    }
  });
}

async function payoutAllStakers(provider) {
  let eraStart = 86;
  let eraEnd = 90;
  let aliceSeed = '//Alice';
  let bobSeed = '//Bob';
  let charlieSeed = '//Charlie';
  const keyring = new Keyring({ type: 'sr25519' });
  const aliceKeyPair = await keyring.addFromUri(aliceSeed);
  const bobKeyPair = await keyring.addFromUri(bobSeed);
  const charlieKeyPair = await keyring.addFromUri(charlieSeed);
  for (let i = eraStart; i <= eraEnd; i++) {
    await Promise.all([
      await payoutStakers(i, aliceKeyPair, provider),
      await payoutStakers(i, bobKeyPair, provider),
      await payoutStakers(i, charlieKeyPair, provider)
    ]);
  }
}


async function addKeys() {
  // await addNodeOneAliceKeys();
  // await addNodeOneKeys();
  // addNodeTwoKeys();
  // addNodeThreeKeys();
  // addNodeFourKeys();
  // addNodeFiveKeys();

  // const nodeUrl = 'ws://127.0.0.1:9944';
  const nodeUrl = 'ws://54.255.191.47:9944';
  const provider: any = await createConnection(nodeUrl);
  const keyring = new Keyring({ type: 'sr25519' });
  const rootKeyPair = await keyring.addFromUri('//Alice');
  // await sleep(10000);
  // await addValidatorOne(rootKeyPair);
  // await addValidatorBobTwo(rootKeyPair);
  // await addValidatorTwo(provider, rootKeyPair);
  // await addValidatorThree(provider, rootKeyPair);
  // await addValidatorFour(provider, rootKeyPair);
  // await addValidatorFive(provider, rootKeyPair);
  await payoutAllStakers(provider);
  console.log('Done');
}

addKeys();