pragma circom 2.1.5;

include "@zk-email/circuits/regexes/from_regex.circom";
include "@zk-email/circuits/email-verifier.circom";
include "./transaction-regex.circom";

// Here, n and k are the BN parameters for RSA
// This is because the number is chunked into k pack_size of n bits each
// Max header bytes shouldn't need to be changed much per email,
// but the max body bytes may need to be changed to be larger if the email has a lot of i.e. HTML formatting
// TODO: split into header and body
template CycraneVerifier(max_header_bytes, max_body_bytes, n, k, pack_size, expose_from) {
    assert(expose_from < 2); // 1 if we should expose the from, 0 if we should not

    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input pubkey[k]; // rsa pubkey, verified with smart contract + DNSSEC proof. split up into k parts of n bits each.
    signal input signature[k]; // rsa signature. split up into k parts of n bits each.
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    // Identity commitment
    signal input body_hash_idx;
    signal input precomputed_sha[32];
    signal input in_body_padded[max_body_bytes];
    signal input in_body_len_padded_bytes;

    component EV = EmailVerifier(max_header_bytes, max_body_bytes, n, k, 1);
    EV.in_padded <== in_padded;
    EV.modulus <== pubkey;
    EV.signature <== signature;
    EV.in_len_padded_bytes <== in_len_padded_bytes;
    // TODO: Verify SHA signing of body properlly
    // EV.body_hash_idx <== body_hash_idx;
    // EV.precomputed_sha <== precomputed_sha;
    // EV.in_body_padded <== in_body_padded;
    // EV.in_body_len_padded_bytes <== in_body_len_padded_bytes;

    // FROM HEADER REGEX: 736,553 constraints
    // This extracts the from email, and the precise regex format can be viewed in the README
    if(expose_from){
        var max_email_from_len = 30;
        var max_email_from_packed_bytes = count_packed(max_email_from_len, pack_size);
        assert(max_email_from_packed_bytes < max_header_bytes);

        signal input email_from_idx;
        signal output reveal_email_from_packed[max_email_from_packed_bytes]; // packed into 7-bytes. TODO: make this rotate to take up even less space

        signal (from_regex_out, from_regex_reveal[max_header_bytes]) <== FromRegex(max_header_bytes)(in_padded);
        log(from_regex_out);
        from_regex_out === 1;
        reveal_email_from_packed <== ShiftAndPack(max_header_bytes, max_email_from_len, pack_size)(from_regex_reveal, email_from_idx);
    
         // Body reveal vars
        var max_transaction_len = 10752;
        var max_transaction_packed_bytes = max_body_bytes;
        signal input transaction_calldata_idx;
        signal output reveal_transaction_packed[max_transaction_packed_bytes];

        // TRANSACTION REGEX: ?????? constraints
        // This computes the regex states on each character in the email body. For new emails, this is the
        // section that you want to swap out via using the zk-regex library.
        signal (tx_regex_out, tx_regex_reveal[max_body_bytes]) <== TransactionRegex(max_body_bytes)(in_body_padded);
        // This ensures we found a match at least once (i.e. match count is not zero)
        signal is_found_transaction <== IsZero()(tx_regex_out);
        is_found_transaction === 0;

        // PACKING: 16,800 constraints (Total: 3,115,057)
        reveal_transaction_packed <== ShiftAndPack(max_body_bytes, max_transaction_len, pack_size)(tx_regex_reveal, transaction_calldata_idx);
    }
}

// In circom, all output signals of the main component are public (and cannot be made private), the input signals of the main component are private if not stated otherwise using the keyword public as above. The rest of signals are all private and cannot be made public.
// This makes pubkey_hash and reveal_twitter_packed public. hash(signature) can optionally be made public, but is not recommended since it allows the mailserver to trace who the offender is.

// Args:
// * max_header_bytes = 1024 is the max number of bytes in the header
// * max_body_bytes = 1536 is the max number of bytes in the body after precomputed slice
// * n = 121 is the number of bits in each chunk of the pubkey (RSA parameter)
// * k = 17 is the number of chunks in the pubkey (RSA parameter)
// * pack_size = 7 is the number of bytes that can fit into a 255ish bit signal (can increase later)
// * expose_from = 0 is whether to expose the from email address
component main { public [ in_body_padded ] } = CycraneVerifier(1024, 1536, 121, 17, 7, 0);