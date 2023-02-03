import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deploySC, WalletClient, ISCData } from '@massalabs/massa-sc-deployer';
import { Args, Client, ClientFactory, IProvider, EOperationStatus, ProviderType } from '@massalabs/massa-web3';

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
        data: readFileSync(path.join(__dirname, 'build', 'oracle.wasm')),
        coins: 1_000_000_000,
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
  console.log(`listening SC events on "${addr}"`)

  let price = BigInt(1000)
  while (1) {

    price = price + BigInt(1)
    // console.log(`calling updatePrice SC`)

    const opId = await client.smartContracts().callSmartContract({
      fee: 0,
      maxGas: 100_000_000,
      coins: 0,
      targetAddress: addr,
      functionName: "updatePrice",
      parameter: new Args().addU64(price).serialize(),
    })
    // console.log("res", opId)
    // const status = await client.smartContracts().getOperationStatus(opId)
    // console.log("status", status)

    // const final = await client.smartContracts().awaitRequiredOperationStatus(opId, EOperationStatus.FINAL)
    // console.log("final", final)


    // console.log(`Done. res= ${bytesToU64(res).toString()}`)

    // const events = await client.smartContracts().getFilteredScOutputEvents({
    //   emitter_address: null,
    //   start: null,
    //   end: null,
    //   original_caller_address: null,
    //   original_operation_id: opId,
    //   is_final: true,
    // });

    // if (events.length) {
    //   console.log(`${events.length} Events received:`);

    //   events.forEach((e) => {

    //     const block = e.context.block!
    //     if (!fetchedBlocks.includes(block)) {
    //       fetchedBlocks.push(block)
    //       console.log("event ID:", e.id);
    //       console.log("block:", e.context.block);
    //       console.log("slot:", e.context.slot);
    //       console.log(e.data);
    //     }

    //   });
    // }

    // const result = await client.smartContracts().readSmartContract({
    //   fee: 0,
    //   maxGas: 700000,
    //   targetAddress: addr,
    //   targetFunction: "getPrice",
    //   parameter: new Args().serialize(),
    // });

    // console.log("read price from SC: ", bytesToU64(new Uint8Array(result.returnValue)).toString())

    delay(2000)
  }

})();
