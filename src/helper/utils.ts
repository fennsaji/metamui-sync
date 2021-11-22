import { u8aToString } from "@polkadot/util";

function didEqual(didA, didB) {
  if (didA.did !== didB.did) {
    return false;
  }
  if (didA.accountId !== didB.accountId) {
    return false;
  }
  if (didA.metadata !== didB.metadata) {
    return false;
  }
  if (didA.value.data.free !== didB.value.data.free) {
    return false;
  }
  if (didA.value.data.reserved !== didB.value.data.reserved) {
    return false;
  }
  return true;
}

function checkDidsEqual(didsA, didsB) {
  didsA.forEach((dd: any) => {
    try {
      let locObj: any = didsB.find((d: any) => d.did == dd.did);
      console.log(dd, " & ", locObj);
      if (!locObj || !locObj.value) {
        console.log('Data Imcomplete', locObj);
        return;
      }
      if (!dd || !dd.value) {
        console.log('Data Imcomplete', dd);
        return;
      }
      console.log("Equal", didEqual(dd, locObj));
    }
    catch (err) {
      console.log(err);
    }
  })
}

const bytesToString = (inputBytes) => u8aToString(inputBytes).replace(/^\0+/, '').replace(/\0+$/, '');

const METABLOCKCHAIN_TYPES = {
  "PeerId": "(Vec<>)",
  "identifier": "[u8;32]",
  "public_key": "[u8;32]",
  "metadata": "Vec<u8>",
  "DidStruct": {
    "identifier": "identifier",
    "public_key": "public_key",
    "metadata": "metadata"
  },
  "Did": "[u8;32]",
  "PublicKey": "[u8;32]",
  "Address": "MultiAddress",
  "LookupSource": "MultiAddress",
  "TreasuryProposal": {
    "proposer": "Did",
    "beneficiary": "Did",
    "value": "Balance",
    "bond": "Balance"
  },
  "CurrencyId": "u32",
  "Amount": "i64",
  "Memo": "Vec<u8>",
  "AccountInfo": "AccountInfoWithDualRefCount",
  "VC": {
    "hash": "Hash",
    "owner": "Did",
    "issuers": "Vec<Did>",
    "signatures": "Vec<Signature>",
    "is_vc_used": "bool",
    "vc_type": "VCType",
    "vc_property": "[u8;128]"
  },
  "VCType": {
    "_enum": [
      "TokenVC",
      "SlashTokens",
      "MintTokens",
      "TokenTransferVC"
    ]
  },
  "TokenVC": {
    "token_name": "[u8;16]",
    "reservable_balance": "u128",
    "decimal": "u8",
    "currency_code": "[u8;8]"
  },
  "SlashMintTokens": {
    "vc_id": "VCid",
    "currency_id": "CurrencyId",
    "amount": "u128"
  },
  "TokenTransferVC": {
    "vc_id": "VCid",
    "currency_id": "CurrencyId",
    "amount": "u128"
  },
  "VCHash": "Vec<u8>",
  "VCStatus": {
    "_enum": [
      "Active",
      "Inactive"
    ]
  },
  "VCid": "[u8;32]",
  "Hash": "H256",
  "Signature": "H512",
  "TokenDetails": {
    "token_name": "Bytes",
    "currency_code": "Bytes",
    "decimal": "u8"
  },
  "TokenBalance": "u128",
  "TokenAccountData": {
    "free": "TokenBalance",
    "reserved": "TokenBalance",
    "frozen": "TokenBalance"
  },
  "TokenAccountInfo": {
    "nonce": "u32",
    "data": "TokenAccountData"
  },
  "Votes": {
    "index": "ProposalIndex",
    "threshold": "MemberCount",
    "ayes": "Vec<Did>",
    "nays": "Vec<Did>",
    "end": "BlockNumber"
  }
}


export {
  METABLOCKCHAIN_TYPES,
  didEqual,
  checkDidsEqual,
  bytesToString,
}