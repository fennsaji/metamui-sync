import { Keyring } from '@polkadot/api';
import { storeDIDOnChain } from './src/helper/did';
import { createConnection } from './src/helper/utils';

async function addKey(node, {suri, aura, gran}) {
  await node.rpc.author.insertKey('aura', suri, aura.key);
  await node.rpc.author.insertKey('gran', suri, gran.key);
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

async function addValidator(node, rootKeyPair) {
  let keyPair = {
    suri: 'fault ethics tank electric perfect inspire quiz unlock inch slide mom account',
    srKey: '0x3a9fff3761adf9e48b29a690fd9f339fae65572e62560a23c2de64f522f29517',
    edKey: '0x831826ba75facbf0d966f59a8c52262972a0318df4becab7011155698df9e509'
  }
  let didObj = {
    publicKey: keyPair.srKey,
    identity: 'did:ssid:node',
    metadata: ''
  };
  await storeDIDOnChain(didObj, rootKeyPair, node, -1)
  let nodeKey = {
    key: 'c12b6d18942f5ee8528c8e2baf4e147b5c5c18710926ea492d09cbd9f6c9f82a',
    peerId: '12D3KooWBmAwcd4PJNJvfV89HwE48nwkRmAgo8Vy3uQEyNNHBox2',
    decodedPeerId: '0x0024080112201ce5f00ef6e89374afb625f1ae4c1546d31234e87e3c3f51a62b91dd6bfa57df'
  }
  let rotatedKeys = await node.rpc.rotateKeys();
}

async function addKeys() {

  // const keyring = new Keyring({ type: 'sr25519' });
  // const rootKeyPair = await keyring.addFromUri('//Alice');
  addNodeOneKeys();
  addNodeTwoKeys();
  // addNodeThreeKeys();
  // addNodeFourKeys();
  // addNodeFiveKeys();
}

addKeys();