import {
  bytesToBigInt,
  stringToBytes,
  toCircomBigIntBytes,
  bufferToString,
  Uint8ArrayToString,
  Uint8ArrayToCharArray,
  assert,
  mergeUInt8Arrays,
  int8toBytes,
} from "@zk-email/helpers/dist/binaryFormat";
import { CIRCOM_FIELD_MODULUS, MAX_HEADER_PADDED_BYTES, MAX_BODY_PADDED_BYTES, STRING_PRESELECTOR } from "@zk-email/helpers/dist/constants";
import { shaHash, partialSha, sha256Pad } from "@zk-email/helpers/dist/shaHash";
// @ts-ignore
import { dkimVerify } from "@zk-email/helpers/dist/dkim/index";
import forge from "node-forge";

export interface ICircuitInputs {
  pubkey: string[];
  signature: string[];
  in_padded: string[];
  in_body_padded: string[];
  in_body_len_padded_bytes: string;
  in_len_padded_bytes: string;
  precomputed_sha: string[];
  body_hash_idx: string;
  // email_from_idx: string;
  // transaction_calldata_idx: string;
}

function findSelector(a: Uint8Array, selector: number[]): number {
  let i = 0; let j = 0;
  while (i < a.length) {
    if (a[i] === selector[j]) {
      j++;
      if (j === selector.length) {
        return i - j + 1;
      }
    } else {
      j = 0;
    }
    i++;
  }
  return -1;
}

// Returns the part of str that appears after substr
function trimStrByStr(str: string, substr: string) {
  const index = str.indexOf(substr);
  if (index === -1) return str;
  return str.slice(index + substr.length, str.length);
}

// padWithZero(bodyRemaining, MAX_BODY_PADDED_BYTES)
function padWithZero(arr: Uint8Array, length: number) {
  while (arr.length < length) {
    arr = mergeUInt8Arrays(arr, int8toBytes(0));
  }
  return arr;
}

export async function getCircuitInputs(
  rsa_signature: BigInt,
  rsa_modulus: BigInt,
  message: Buffer,
  body: Buffer,
  body_hash: string,
): Promise<ICircuitInputs> {
  console.log("Starting processing of inputs");
  // Derive modulus from signature
  // const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
  const modulusBigInt = rsa_modulus;
  // Message is the email header with the body hash
  const prehash_message_string = message;
  // const baseMessageBigInt = AAYUSH_PREHASH_MESSAGE_INT; // bytesToBigInt(stringToBytes(message)) ||
  // const postShaBigint = AAYUSH_POSTHASH_MESSAGE_PADDED_INT;
  const signatureBigInt = rsa_signature;

  // Perform conversions
  const prehashBytesUnpadded = typeof prehash_message_string == "string" ? new TextEncoder().encode(prehash_message_string) : Uint8Array.from(prehash_message_string);
  const postShaBigintUnpadded = bytesToBigInt(stringToBytes((await shaHash(prehashBytesUnpadded)).toString())) % CIRCOM_FIELD_MODULUS;

  // Sha add padding
  // 65 comes from the 64 at the end and the 1 bit in the start, then 63 comes from the formula to round it up to the nearest 64. see sha256algorithm.com for a more full explanation of paddnig length
  const calc_length = Math.floor((body.length + 63 + 65) / 64) * 64;
  const [messagePadded, messagePaddedLen] = await sha256Pad(prehashBytesUnpadded, MAX_HEADER_PADDED_BYTES);
  const [bodyPadded, bodyPaddedLen] = await sha256Pad(body, Math.max(MAX_BODY_PADDED_BYTES, calc_length));

  // Convet messagePadded to string to print the specific header data that is signed
  console.log(JSON.stringify(message).toString());

  // Ensure SHA manual unpadded is running the correct function
  const shaOut = await partialSha(messagePadded, messagePaddedLen);

  assert((await Uint8ArrayToString(shaOut)) === (await Uint8ArrayToString(Uint8Array.from(await shaHash(prehashBytesUnpadded)))), "SHA256 calculation did not match!");

  // Precompute SHA prefix
  const TRANSACTION_SELECTOR = STRING_PRESELECTOR;
  const selector = TRANSACTION_SELECTOR.split("").map((char) => char.charCodeAt(0));
  const selector_loc = findSelector(bodyPadded, selector);
  console.log("Body selector found at: ", selector_loc);
  const shaCutoffIndex = Math.floor(selector_loc / 64) * 64;
  const precomputeText = bodyPadded.slice(0, shaCutoffIndex);
  let bodyRemaining = bodyPadded.slice(shaCutoffIndex);
  console.log(new TextDecoder().decode(bodyRemaining))
  const bodyRemainingLen = bodyPaddedLen - precomputeText.length;
  assert(bodyRemainingLen < MAX_BODY_PADDED_BYTES, "Invalid slice");
  assert(bodyRemaining.length % 64 === 0, "Not going to be padded correctly with int64s");
  bodyRemaining = padWithZero(bodyRemaining, MAX_BODY_PADDED_BYTES);
  assert(bodyRemaining.length === MAX_BODY_PADDED_BYTES, "Invalid slice");
  const bodyShaPrecompute = await partialSha(precomputeText, shaCutoffIndex);

  // Compute identity revealer
  const pubkey = toCircomBigIntBytes(modulusBigInt);
  const signature = toCircomBigIntBytes(signatureBigInt);

  const in_len_padded_bytes = messagePaddedLen.toString();
  const in_padded = await Uint8ArrayToCharArray(messagePadded); // Packed into 1 byte signals
  const in_body_len_padded_bytes = bodyRemainingLen.toString();
  const in_body_padded = await Uint8ArrayToCharArray(bodyRemaining);
  const precomputed_sha = await Uint8ArrayToCharArray(bodyShaPrecompute);
  const body_hash_idx = bufferToString(message).indexOf(body_hash).toString();

  let raw_header = Buffer.from(prehash_message_string).toString();
  const email_from_idx = (raw_header.length - trimStrByStr(trimStrByStr(raw_header, "from:"), "<").length).toString();
  //in javascript, give me a function that extracts the first word in a string, everything before the first space

  const transaction_calldata_idx = (Buffer.from(bodyRemaining).indexOf(TRANSACTION_SELECTOR) + TRANSACTION_SELECTOR.length).toString()

  console.log("Indexes into header string are: ", email_from_idx);

  return {
    in_padded,
    pubkey,
    signature,
    in_len_padded_bytes,
    precomputed_sha,
    in_body_padded,
    in_body_len_padded_bytes,
    // transaction_calldata_idx,
    body_hash_idx,
    // email_from_idx, TODO: Verify from email in ZKP as well
  };
}

export async function generate_inputs(email: Buffer | string): Promise<ICircuitInputs> {
  email = typeof email === "string" ? Buffer.from(email) : email as Buffer;

  console.log("DKIM verification starting");
  const result = await dkimVerify(email);
  // console.log("From:", result.headerFrom);
  // console.log("Results:", result.results[0]);
  if (!result.results[0]) {
    throw new Error(`No result found on dkim output ${result}`);
  } else {
    if (!result.results[0].publicKey) {
      if (result.results[0].status.message) {
        throw new Error(result.results[0].status.message);
      } else {
        throw new Error(`No public key found on generate_inputs result ${JSON.stringify(result)}`);
      }
    }
  }
  // const _ = result.results[0].publicKey.toString();
  console.log("DKIM verification successful");
  // try {
  //   // TODO: Condition code on if there is an internet connection, run this code
  //   var frozen = Cryo.stringify(result);
  //   fs.writeFileSync(`./email_cache_2.json`, frozen, { flag: "w" });
  // } catch (e) {
  //   console.log("Reading cached email instead!");
  //   let frozen = fs.readFileSync(`./email_cache.json`, { encoding: "utf-8" });
  //   result = Cryo.parse(frozen);
  // }
  const sig = BigInt("0x" + Buffer.from(result.results[0].signature, "base64").toString("hex"));
  const message = result.results[0].status.signature_header;
  const body = result.results[0].body;
  const body_hash = result.results[0].bodyHash;

  const pubkey = result.results[0].publicKey;
  const pubKeyData = forge.pki.publicKeyFromPem(pubkey.toString());
  // const pubKeyData = CryptoJS.parseKey(pubkey.toString(), 'pem');
  const modulus = BigInt(pubKeyData.n.toString());
  const fin_result = await getCircuitInputs(sig, modulus, message, body, body_hash);
  return fin_result;
}

