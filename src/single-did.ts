import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { METABLOCKCHAIN_TYPES } from "./helper/utils";
import { connection, did, transaction, utils } from 'mui-metablockchain-sdk';
import { setBalance } from "./helper/balance";

async function getDidAndSync(didString, fromUrl, toUrl) {
  const providerFrom = new WsProvider(fromUrl);
  const providerSyncFrom = await ApiPromise.create({
    provider: providerFrom,
    types: METABLOCKCHAIN_TYPES,
  });

  let sanDidString = did.sanitiseDid(didString);
  let didEntry: any = (await providerSyncFrom.query.did.dIDs(sanDidString)).toJSON()[0];
  let didObject: any = {
    did: didString,
    accountId: (await providerSyncFrom.query.did.lookup(sanDidString)).toJSON(),
    metadata: didEntry.metadata,
    value: (await providerSyncFrom.query.did.account(sanDidString)).toJSON(),
  };


  const providerTo = new WsProvider(toUrl);
  const providerSyncTo = await ApiPromise.create({
    provider: providerTo,
    types: METABLOCKCHAIN_TYPES,
  });

  const keyring = new Keyring({ type: 'sr25519' });
  const rootKeyPair = await keyring.addFromUri('//Alice');
  let didObj = {
    public_key: keyring.decodeAddress(didObject.accountId),
    identity: didObject.did,
    metadata: didObject.metadata,
  };

  try {
    await did.storeDIDOnChain(didObj, rootKeyPair, providerSyncTo);
  } catch (err) {
    console.log(err);
  }
  let pubKey = (await providerSyncTo.query.did.lookup(sanDidString)).toJSON();
  try {
    await setBalance(didObject.did, didObject.value.data.free, didObject.value.data.reserved, rootKeyPair, providerSyncTo, -1);
  } catch (err) {
    console.log(err);
  }

}

const localUrl = 'ws://127.0.0.1:9944';
const devUrl = 'wss://n3testnet.metabit.exchange';
const testnetUrl = 'wss://n2testnet.metabit.exchange';
const newNodeUrl = 'wss://n4testnet.metabit.exchange';
// getDidAndSync('did:yidinji:toufeeq', devUrl, localUrl);