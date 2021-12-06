import { connection, did, transaction, utils, token, vc } from 'mui-metablockchain-sdk';

function checkTkAccEq(accountA, accountB) {
  let flag = true;
  // if (accountA.value.data.free !== accountB.value.data.free) {
  //   flag = false;
  // }
  if (accountA.value.data.reserved !== accountB.value.data.reserved) {
    flag = false;
  }
  if (accountA.tokenData.currency_code != accountB.tokenData.currency_code) {
    flag = false;
  }
  if (accountA.tokenData.decimal != accountB.tokenData.decimal) {
    flag = false;
  }
  if (accountA.tokenData.token_name != accountB.tokenData.token_name) {
    flag = false;
  }
  if(accountA.tokenIssuer != accountB.tokenIssuer) {
    flag = false;
  }
  return flag;
}

function checkTokenAccountsEqual(nodeATokenAccs, nodeBTokenAccs) {
  // if (nodeATokenAccs.length != nodeBTokenAccs.length) {
  //   return false;
  // }
  let flag = true;
  nodeATokenAccs.forEach(accountA => {
    let accountB: any = nodeBTokenAccs.find((t: any) => t.tokenData.currency_code == accountA.tokenData.currency_code);
    if (!accountB) {
      flag = false;
      console.log('Not Equal', accountA, accountB);
      return;
    }
    if(!checkTkAccEq(accountA, accountB)) {
      flag = false;
      console.log('Not Equal', accountA, accountB);
    }
  });
  return flag;
}

async function getTokenAccounts(provider) {
  return await Promise.all((await provider.query.tokens.accounts.entries())
    .map(async ([{ args: [did, currencyCode] }, value]) => {
      let tokenData = await token.getTokenData(currencyCode.toHuman(), provider);
      let tokenIssuer = await token.getTokenIssuer(currencyCode.toHuman(), provider);
      return { 
        did: did.toHuman(), 
        value: value.toJSON(), 
        tokenData,
        tokenIssuer,
      };
    }));
}

async function getDetailedTokenBalance(did_hex, currencyId, tokenData, provider) {
  const data = (await provider.query.tokens.accounts(did_hex, currencyId)).toJSON();
}

async function issueToken(
  vcId,
  totalIssuanceAmt,
  senderAccountKeyPair,
  api = false,
  nonce,
) {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = api || (await connection.buildConnection('local'));
      const tx = provider.tx.sudo.sudo(provider.tx.tokens.issueToken(
        vcId,
        totalIssuanceAmt,
      ));
      nonce = nonce ?? await provider.rpc.system.accountNextIndex(senderAccountKeyPair.address);
      let signedTx = tx.sign(senderAccountKeyPair, {nonce});
      await signedTx.send(function ({ status, dispatchError, events }) {
        if (status.isInBlock || status.isFinalized) {
          events
            // We know this tx should result in `Sudid` event.
            // .filter(({ event }) =>
            //   provider.events.sudo.Sudid.is(event)
            // )
            // We know that `Sudid` returns just a `Result`
            .forEach(({ event : { data: [result] } }) => {
              // Now we look to see if the extrinsic was actually successful or not...
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
        }

        if (dispatchError) {
          if (dispatchError.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = provider.registry.findMetaError(dispatchError.asModule);
            const { documentation, name, section } = decoded;
            // console.log(`${section}.${name}: ${documentation.join(' ')}`);
            reject(new Error(`${section}.${name}`));
          } else {
            // Other, CannotLookup, BadOrigin, no extra info
            // console.log(dispatchError.toString());
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isInBlock) {
          // console.log('Finalized block hash', status.asFinalized.toHex());
          resolve(signedTx.hash.toHex())
        }
      });
    } catch (err) {
      // console.log(err);
      reject(err);
    }
  });
}

export {
  checkTokenAccountsEqual,
  getTokenAccounts,
  getDetailedTokenBalance,
  issueToken,
}