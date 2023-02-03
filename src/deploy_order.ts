import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deploySC, WalletClient, ISCData } from '@massalabs/massa-sc-deployer';
import { Args, Client, ClientFactory, IProvider, EOperationStatus, ProviderType } from '@massalabs/massa-web3';

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

let name = "toto";
let orderType = "buy"; // either "buy" or "sell"
let quantity = 1;
let limit_price = 2000;
let oracleAddr = "A1UN6RKtwmH1wcCuTpWHE3nPbCrben15um5VRvhoDGU2qu39GKH";

(async () => {
    const deployed = await deploySC(
        publicApi,
        deployerAccount,
        [
            {
                data: readFileSync(path.join(__dirname, 'build', 'order_limit.wasm')),
                coins: 1000,
                args: new Args().addString(name).addString(orderType).addU32(quantity).addU32(limit_price).addString(oracleAddr),
            } as ISCData,
        ],
        1000,
        4_200_000_000,
        true,
    );


    const deployedSCEvent = deployed.events?.find(e => e.data.includes("Contract deployed at address"))
    console.log("event", deployedSCEvent)
    const addr = deployedSCEvent!.data.substring("Contract deployed at address: ".length, deployedSCEvent?.data.length)

    deployed.events!.forEach((e) => {
        console.log("event ID:", e.id);
        console.log("block:", e.context.block);
        console.log("slot:", e.context.slot);
        console.log(e.data);
    });

})();
