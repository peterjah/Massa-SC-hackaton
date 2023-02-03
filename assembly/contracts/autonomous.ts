import {
  callerHasWriteAccess,
  currentPeriod,
  generateEvent,
  Context,
  sendMessage,
  Storage,
  unsafeRandom
} from '@massalabs/massa-as-sdk';
import { i64ToBytes } from '@massalabs/as-types';

const PRICE_KEY = 'PRICE_KEY';
const INIT_PRICE = 1000;

export function constructor(_: StaticArray<u8>): StaticArray<u8> {
  // This line is important. It ensure that this function can't be called in the future.
  // If you remove this check someone could call your constructor function and reset your SC.
  if (!callerHasWriteAccess()) {
    return [];
  }

  // Set initial oracle price
  generateEvent(`Set initial price to ${INIT_PRICE.toString()}`);
  Storage.set(PRICE_KEY, INIT_PRICE.toString())

  setFuturOperation()

  return [];
}

function setFuturOperation(): void {

  const functionName = "setPrice"
  const address = Context.callee();
  const current_period = currentPeriod();
  const validityStartPeriod = current_period + 1;
  const validityStartThread = 0 as u8;
  const validityEndPeriod = validityStartPeriod;
  const validityEndThread = 31 as u8;
  const maxGas = 1_000_000_000; // gas for smart contract execution
  const rawFee = 0;
  const coins = 1_000; // coins that can be used inside SC

  // Send the message
  sendMessage(address, functionName,
    validityStartPeriod, validityStartThread, validityEndPeriod, validityEndThread,
    maxGas, rawFee, coins, []);

  generateEvent(`next update planned on period ${validityStartPeriod.toString()} thread: ${validityStartThread.toString()}`);
}


function generateRandomIncrease(base: i64): i64 {
  const randomInt = unsafeRandom();
  const increasePercent = randomInt % 20 - 10;
  const increase = base * increasePercent / 100;
  return base + increase;
}


export function setPrice(_: StaticArray<u8>): StaticArray<u8> {

  //TODO restrict access

  let newPrice: i64;
  if (!Storage.has(PRICE_KEY)) {
    generateEvent(`price is not set (Should not happen)`);
    return []
  }
  const currentPrice = Storage.get(PRICE_KEY)
  newPrice = generateRandomIncrease(i64.parse(currentPrice))
  Storage.set(PRICE_KEY, newPrice.toString())
  generateEvent(`🎉 Price updated: ${newPrice.toString()}`);

  setFuturOperation()

  return i64ToBytes(newPrice)
}


export function getPrice(_: StaticArray<u8>): StaticArray<u8> {
  generateEvent(`getPrice func`);

  if (!Storage.has(PRICE_KEY)) {
    generateEvent(`price is not set`);
    return []
  }

  const price = i64.parse(Storage.get(PRICE_KEY))
  generateEvent(`current price is ${price.toString()}`);

  return i64ToBytes(price)
}

