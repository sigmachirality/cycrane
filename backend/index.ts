import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { Chain, EIP1193RequestFn, TransportConfig, createWalletClient, http } from "viem";
import { polygonMumbai } from "viem/chains";
import { privateKeyToAccount } from 'viem/accounts'
import sendAATransaction from "./sendTransaction";

const imap = new Imap({
	user: "bagrimanasbir@gmail.com",
	password: "oxtl njvz pxkz vgqq",
	host: "imap.gmail.com", // Replace with your IMAP server
	port: 993, // IMAPS (secure) port
	tls: true,
});

const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');


let wallet = createWalletClient({
	chain: polygonMumbai,
	transport: http(),
	account
})


async function handleNewEmails() {
	imap.on("mail", () => {
		// Fetch the most recent email (you can modify this as needed)
		imap.openBox("INBOX", true, (err: Error | null, mailbox: Imap.Box) => {
			if (err) throw err;

			const fetch = imap.seq.fetch("*", {
				bodies: "TEXT",
				struct: true,
			});

			fetch.on("message", (msg: Imap.ImapMessage, seqno: number) => {
				console.log(`New email #${seqno}`);
				msg.on("body", (stream: NodeJS.ReadableStream, info: any) => {
					let data = "";
					stream.on("data", (chunk) => {
						data += chunk.toString("utf8");
					});
					stream.on("end", async () => {
						let parsed = await simpleParser(data);
						console.log(parsed.text); // Log the email content
						// call proof generation

						await sendAATransaction(wallet, account, polygonMumbai, parsed.text!, "proof");
				});
			});

			fetch.once("end", () => {
				console.log("No more emails to fetch.");
			});
		});
	});
}

// Connect to the IMAP server and start monitoring for new emails
imap.connect();

imap.once("ready", () => {
	console.log("Connected to the IMAP server.");
	imap.openBox("INBOX", true, (err: Error | null) => {
		if (err) throw err;
		handleNewEmails(); // Start monitoring for new emails
	});
});

imap.once("error", (err: Error) => {
	console.error(`IMAP error: ${err.message}`);
});

imap.once("end", () => {
	console.log("Disconnected from the IMAP server.");
});

// Handle CTRL+C gracefully
process.on("SIGINT", () => {
	imap.end();
	console.log("IMAP client disconnected.");
	process.exit();
});

