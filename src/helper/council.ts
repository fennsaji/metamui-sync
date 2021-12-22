import { connection, did, transaction, utils ,collective } from 'mui-metablockchain-sdk';

async function setMembers(newMembers, prime, oldCount, signingKeypair, api = false) {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = api || await connection.buildConnection('local');
      newMembers = newMembers.map(newMember => did.sanitiseDid(newMember));
      prime = prime ? did.sanitiseDid(prime): null;
      const tx = provider.tx.sudo.sudo(
        provider.tx.council.setMembers(newMembers, prime, oldCount)
      );
      let nonce = await provider.rpc.system.accountNextIndex(signingKeypair.address);
      let signedTx = tx.sign(signingKeypair, {nonce});
      await signedTx.send(function ({ status, dispatchError }) {
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
        } else if (status.isReady) {
          // console.log('Finalized block hash', status.asFinalized.toHex());
          // console.log('Transaction send to provider', status.asFinalized.toHex());
          resolve(signedTx.hash.toHex());
        }
      });
    } catch (err) {
      // console.log(err);
      reject(err);
    }
  });
}


async function propose(threshold, proposal, lengthCount, signingKeypair, api = false, nonce) {

  return new Promise(async (resolve, reject) => {
    try {
      const provider = api || await connection.buildConnection('local');
      const tx = provider.tx.council.propose(threshold, proposal, lengthCount);
      nonce = nonce ?? await provider.rpc.system.accountNextIndex(signingKeypair.address);
      let signedTx = tx.sign(signingKeypair, {nonce});
      await signedTx.send(function ({ status, dispatchError }) {
        if (dispatchError) {
          if (dispatchError.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = provider.registry.findMetaError(dispatchError.asModule);
            const { documentation, name, section } = decoded;
            reject(new Error(`${section}.${name}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isReady) {
          resolve(signedTx.hash.toHex());
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function getCouncilData(provider) {
  let members = await collective.getMembers(provider);
  let prime = await collective.getPrime(provider);
  let proposalHashes = await collective.getProposals(provider);
  let proposals = await Promise.all(proposalHashes.map(async proposalHash => {
    const proposal = await collective.getProposalOf(proposalHash, provider);
    return {
      proposalHash,
      proposal,
    }
  }));
  return {members, prime, proposals};
}

function checkIfMembersPrimeEqual({prime, members}, {newPrime, newMembers}) {
  let flag = true;
  if(prime != newPrime) {
    flag = false;
    return flag;
  }
  members.forEach(arg => {
    if(!newMembers.includes(arg)) {
      flag = false;
    }
  });
  return flag;
}

function checkProposalEqual(proposalA, proposalB) {
  let flag = true;
  if(proposalA.method != proposalB.method) {
    flag = false;
  }
  if(proposalA.section != proposalB.section) {
    flag = false;
  }
  proposalA.args.forEach(arg => {
    if(!proposalB.args.includes(arg)) {
      flag = false;
    }
  });
  return flag;
}

function checkIfProposalsEqual(proposals, newProposals) {
  let flag = true;
  proposals.forEach(proposalA => {
    let proposalB: any = newProposals.find((t: any) => (t.proposalHash == proposalA.proposalHash));
    if (!proposalB) {
      flag = false;
      console.log('Undefined B', proposalA, proposalB);
      return;
    }
    if (!checkProposalEqual(proposalA.proposal, proposalB.proposal)) {
      flag = false;
      console.log('Not Equal', proposalA, proposalB);
    }
  });
  return flag;
}

export {
  setMembers,
  propose,
  getCouncilData,
  checkIfProposalsEqual,
  checkIfMembersPrimeEqual,
}