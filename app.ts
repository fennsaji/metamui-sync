import { connection, did } from 'mui-metablockchain-sdk';
import { u8aToString } from '@polkadot/util';

const bytesToString = (inputBytes) => u8aToString(inputBytes).replace(/^\0+/, '').replace(/\0+$/, '');

/**
 * @param  {WsProvider} [api] (Optional) Api provider
 * @param  {String} [blockHash] (Optional) Hash of block 
 * @returns Array<{did: String, accountId: String, value: AccountInfo}>
 */
 async function getAllAccountInfo(api=false, hash=null) {
  const provider = api || (await connection.buildConnection('local'));
  const dids = (await provider.query.did.dIDs.keys())
    .map(({args: [key]}) => {
      return key;
    });
  if(!hash) {
    return Promise.all(dids.map(async key => {
      return {
        did: bytesToString(key),
        accountId: (await did.resolveDIDToAccount(bytesToString(key), provider)),
        value: (await provider.query.did.account(key)).toHuman(),
      };
    }));
  }
  return Promise.all(dids.map(async key => {
    return {
      did: bytesToString(key),
      accountId: (await provider.query.did.lookup.at(hash, key)).toHuman(),
      value: (await provider.query.did.account.at(hash, key)).toHuman(),
    };
  }));
}

async function getDidAccountsSnapshot() {
  // Create Connection to substrate node
  const provider = await connection.buildConnection('local', true);
  const data = await getAllAccountInfo(provider);

  const blockHash = await provider.rpc.chain.getBlockHash(0);

  const dataAt = await getAllAccountInfo(provider, blockHash);

}

getDidAccountsSnapshot();