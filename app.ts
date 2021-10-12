import { connection, did, utils, token, transaction, balance } from 'mui-metablockchain-sdk';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
import { removeDid } from './modules/did';
import { setBalance, forceTransfer } from './modules/balance';

const fennMnemonic = 'strong offer usual inmate reform universe zero erode reopen mosquito blossom bachelor';
const identifier = 'fenn';
const aliceDid = 'did:ssid:swn';
const timeout = 6000;
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Create new DID and transfer some amount from Alice account
async function createDidAndTransfer() {
  // Create Connection to substrate node
  const provider = await connection.buildConnection('local', true);

  // Get Keyring pair for sign transactions
  const keyring = new Keyring({ type: 'sr25519' });
  const sig_key_pair = await keyring.addFromUri('//Alice');
  console.log(sig_key_pair);

  // Is Alice validator
  const isValidator = await did.isDidValidator(aliceDid, provider);
  console.log('Alice Validator:', isValidator);

  // Alice Initial Balance
  let aliceBalance = await balance.getBalance(aliceDid, provider);
  console.log('Alice Balance 1:', aliceBalance);


  // Create DID
  const mnemonic = await did.generateMnemonic();
  let testDid = await did.generateDID(mnemonic, identifier, 'Test');
  try {
    console.log('DID Generated:', testDid);
    await wait(timeout);
    await did.storeDIDOnChain(testDid, sig_key_pair, provider);
    let fennBalance = await balance.getBalance(testDid.identity, provider);
    console.log('Fenn Balance 1:', fennBalance);
    let didDetailsOne = await did.getDIDDetails(testDid.identity);
    console.log('DID Details:', didDetailsOne);

    // Subscribe to balance change
    await balance.subscribeToBalanceChanges(aliceDid, (balance) =>  {
      console.log('Alice Balance Changed:', balance);
    }, provider);

    await balance.subscribeToBalanceChanges(testDid.identity, (balance) =>  {
      console.log('Fenn Balance Changed:', balance);
    }, provider);

    // Set balance in new did
    // await wait(timeout);
    // await setBalance(testDid.identity, 1000000000, 1000, sig_key_pair, provider);

    // Confirm if DID is created
    let didDetailsTwo = (await did.getDIDDetails(testDid.identity)).arg1;
    console.log('DID Details:', didDetailsTwo);
    const accountId = await did.resolveDIDToAccount(testDid.identity);
    console.log('Account Id from DID:', accountId);
    const didFromAccount = await did.resolveAccountIdToDid(accountId);
    console.log('Did from Account:', didFromAccount);

    // Update metadata of DID
    await wait(timeout);
    const updateDIDMetadata = await did.updateMetadata(testDid.identity, 'Test 2', sig_key_pair, provider);
    console.log('Update DID Metadata:', updateDIDMetadata);
    let didDetails = (await did.getDIDDetails(testDid.identity));
    console.log('DID Details:', didDetails);


    // Rotate Key
    const newMnemonic = await did.generateMnemonic();
    const pubKey = await keyring.addFromUri(newMnemonic).publicKey;
    await wait(timeout);
    let updatedTestDid = await did.updateDidKey(testDid.identity, pubKey, sig_key_pair, provider);
    console.log('DID Generated:', updatedTestDid);
    didDetails = (await did.getDIDDetails(testDid.identity));
    console.log('DID Details:', didDetails);

    // Get Did key history
    await wait(timeout);
    const keyHistory = await did.getDidKeyHistory(testDid.identity, provider);
    console.log('Key History:', keyHistory);


    // Transfer Amount from Alice to created DID
    // await wait(timeout);
    await transaction.sendTransaction(sig_key_pair, testDid.identity, 1000000, provider, 100);

    // await wait(timeout);
    await transaction.transfer(sig_key_pair, testDid.identity, 2000000, 'Test 3', provider, 200);

    // Remove DID
    await wait(timeout);
    await removeDid(testDid.identity, sig_key_pair, provider);

  } catch (err) {
    await wait(timeout);
    await removeDid(testDid.identity, sig_key_pair, provider);
  }
}

createDidAndTransfer();