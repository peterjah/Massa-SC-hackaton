import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deploySC, WalletClient, ISCData } from '@massalabs/massa-sc-deployer';
import { Client, ClientFactory, IProvider, ISlot, ProviderType } from '@massalabs/massa-web3';
import delay from "delay"
import { IEvent } from '../../massa-web3/dist/interfaces/IEvent';

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

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(path.dirname(__filename));

const client: Client = await ClientFactory.createCustomClient(
  [
    { url: publicApi, type: ProviderType.PUBLIC } as IProvider,
    { url: publicApi, type: ProviderType.PRIVATE } as IProvider,
  ],
  true,
  deployerAccount,
);

const nextSlot = (prevSlot: ISlot) => {
  const slot = prevSlot
  if (slot.thread < 31) {
    slot.thread++
  } else {
    slot.thread = 0
    slot.period++
  }
  return slot
}

(async () => {
  const deployed = await deploySC(
    publicApi,
    deployerAccount,
    [
      {
        data: readFileSync(path.join(__dirname, 'build', 'autonomous.wasm')),
        coins: 1_000_000_000_000,
      } as ISCData,
    ],
    0,
    4_200_000_000,
    true,
  );

  const deployedSCEvent = deployed.events?.find(e => e.data.includes("Contract deployed at address"))!
  console.log("deployedSCEvent.context.call_stack",deployedSCEvent.context.call_stack)
  const addr = deployedSCEvent!.data.substring("Contract deployed at address: ".length, deployedSCEvent?.data.length)
  let slot = nextSlot(deployedSCEvent.context.slot);
  console.log(`listening autonomous SC events on "${addr}"`, slot)

  while (1) {
    console.log(`get events from period ${slot.period} thread ${slot.thread}`)

    const events: IEvent[] = await client.smartContracts().getFilteredScOutputEvents({
      emitter_address: addr,
      start: slot,
      end: null,
      original_caller_address: null,
      original_operation_id: null,
      is_final: true,
    });

    if (events.length) {
      console.log(`${events.length} events received:`);

      const uniqueBlocks = [...new Set(events.map(e => e.context.block))];
      for( const blockId of uniqueBlocks) {
        const logs = events.filter(e => e.context.block === blockId)
        logs.map(l => console.log(l.data))
        console.log(logs[0].context.slot);
        console.log("\n")
      }
      console.log("\n")


      const lastSlot = events.map(e => e.context.slot).reduce((prev, cur) => {
        if (cur.period > prev.period || (cur.period === prev.period && cur.thread > prev.thread)) {
          return cur
        }
        return prev
      }, slot)
      slot = nextSlot(lastSlot);

    }

    console.log("\n")

    await delay(5000)
  }

})();
