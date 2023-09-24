import fs from "fs";
import { generate_inputs } from "../utils/generateInput";

async function getArgs() {
  const args = process.argv.slice(2);
  const emailFileArg = args.find((arg) => arg.startsWith("--email_file="));
  const email_file = emailFileArg ? emailFileArg.split("=")[1] : "./scripts/example.eml";
  return { email_file };
}

// Only called when the whole function is called from the command line, to read inputs
// Will generate a test proof with the empty Ethereum address, that cannot be proven by anybody else
async function test_generate(writeToFile: boolean = true) {
  const { email_file } = await getArgs();
  const email = fs.readFileSync(email_file.trim());
  console.log(email);
  const gen_inputs = await generate_inputs(email);
  console.log(JSON.stringify(gen_inputs));
  if (writeToFile) {
    const filename = './input.json'
    console.log(`Writing to default file ${filename}`);
    fs.writeFileSync(filename, JSON.stringify(gen_inputs), { flag: "w" });
  }
  return gen_inputs;
}

test_generate();
