import Imap from "node-imap";

const imap = new Imap({
	user: "bagrimanasbir@gmail.com",
	password: "oxtl njvz pxkz vgqq",
	host: "imap.gmail.com", // Replace with your IMAP server
	port: 993, // IMAPS (secure) port
	tls: true,
});


async function handleNewEmails() {
	imap.on("mail", () => {
		// Fetch the most recent email (you can modify this as needed)
		imap.openBox("INBOX", true, (err: Error | null, mailbox: Imap.Box) => {
			if (err) throw err;

			const fetch = imap.seq.fetch("*", {
				bodies: [''],
				struct: true,
			});

			fetch.on("message", (msg: Imap.ImapMessage, seqno: number) => {
				console.log(`New email #${seqno}`);
				const chunks: Buffer[] = [];

				msg.on('body', (stream, info) => {
					stream.on('data', (chunk: Buffer) => {
						chunks.push(chunk);
					});

					stream.on('buffer', (data) => {
						console.log(data.toString());
					});

					stream.on('end', () => {
						// Parse the raw EML content and perform DKIM verification here
						// You can use the "mailparser" library to parse the email
						// and a DKIM library to verify the DKIM signature.
			
						// Example:
						// const { simpleParser } = require('mailparser');
						// const parsedEmail = await simpleParser(rawEml);
						// Perform DKIM verification on parsedEmail
			
						console.log('New Email Received:');
						console.log(Buffer.concat(chunks).toString());
					  });
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


