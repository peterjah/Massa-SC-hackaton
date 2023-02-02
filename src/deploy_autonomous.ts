import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deploySC, WalletClient, ISCData } from '@massalabs/massa-sc-deployer';
import { Client, ClientFactory, IProvider, ISlot, ProviderType } from '@massalabs/massa-web3';
import delay from "delay"

dotenv.config();

const publicApi = process.env.JSON_RPC_URL_PUBLIC;
if (!publicApi) {
  throw new Error('Missing JSON_RPC_URL_PUBLIC in .env file');
}
const privKey = process.env.WALLET_PRIVATE_KEY;
if (!privKey) {
  throw new Error('Missing WALLET_PRIVATE_KEY in .env file');
}

const deployerAccount = await WalletClient.getAccountFromSecretKey(privKey);

console.log("deployer address", deployerAccount.address)

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(path.dirname(__filename));

const client: Client = await ClientFactory.createCustomClient(
  [
    { url: publicApi, type: ProviderType.PUBLIC } as IProvider,
    // This IP is false but we don't need private for this script so we don't want to ask one to the user
    // but massa-web3 requires one
    { url: publicApi, type: ProviderType.PRIVATE } as IProvider,
  ],
  true,
  deployerAccount,
);

(async () => {
  const deployed = await deploySC(
    publicApi,
    deployerAccount,
    [
      {
        data: readFileSync(path.join(__dirname, 'build', 'autonomous.wasm')),
        coins: 1_000_000_000_000,
        // args: new Args(),
      } as ISCData,
    ],
    0,
    4_200_000_000,
    true,
  );


  const deployedSCEvent = deployed.events?.find(e => e.data.includes("Contract deployed at address"))
  console.log("event", deployedSCEvent)
  const addr = deployedSCEvent!.data.substring("Contract deployed at address: ".length, deployedSCEvent?.data.length)

  let fetchedBlocks: string[] = []
  let slot = {} as ISlot;
  console.log(`listening autonomous SC events on "${addr}"`)

  while (1) {

    const events = await client.smartContracts().getFilteredScOutputEvents({
      emitter_address: addr,
      start: slot?.thread ? slot: null,
      end: null,
      original_caller_address: null,
      original_operation_id: null,
      is_final: true,
    });

    if (events.length) {
      console.log(`${events.length} Events received:`);

      events.forEach((e) => {

        const block = e.context.block!
        if(!fetchedBlocks.includes(block)) {
          fetchedBlocks.push(block)
          slot = e.context.slot
          console.log("event ID:",e.id);
          console.log("block:",e.context.block);
          console.log("slot:",e.context.slot);
          console.log(e.data);
        }

      });
      slot.thread++
    }

    await delay(1000)
  }

})();