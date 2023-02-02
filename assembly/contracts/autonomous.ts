// The entry file of your WebAssembly module.
import {
  callerHasWriteAccess,
  currentPeriod,
  generateEvent,
  Context,
  sendMessage,
  balanceOf,
  Storage,
  unsafeRandom
} from '@massalabs/massa-as-sdk';
import { i64ToBytes } from '@massalabs/as-types';

const PRICE_KEY = 'PRICE_KEY';
const INIT_PRICE = 1000;

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param binaryArgs - Arguments serialized with Args
 */
export function constructor(_: StaticArray<u8>): StaticArray<u8> {
  // This line is important. It ensure that this function can't be called in the future.
  // If you remove this check someone could call your constructor function and reset your SC.
  if (!callerHasWriteAccess()) {
    return [];
  }

  generateEvent(`Context.caller() ${Context.caller()}`);
  generateEvent(`Balance ${balanceOf(Context.caller().toString())}`);

  generateEvent(`Context.callee() ${Context.callee()}`);
  generateEvent(`Balance ${balanceOf(Context.callee().toString())}`);

  // Set initial orable price
  generateEvent(`Set initial price to ${INIT_PRICE.toString()}`);
  Storage.set(PRICE_KEY, INIT_PRICE.toString())


  // Setup the 'message' we will send to our deployed SC
  const functionName = "updatePrice"
  const address = Context.callee();

  const current_period = currentPeriod();
  const validityStartPeriod = current_period + 1;
  const validityStartThread = 1 as u8;
  const validityEndPeriod = current_period + 100;
  const validityEndThread = 1 as u8;
  const maxGas = 1_000_000_000 as u64; // gas for smart contract execution
  const rawFee = 0 as u64;
  const coins = 10_000 as u64; // coins that can be used inside SC

  // Send the message
  sendMessage(address, functionName,
    validityStartPeriod, validityStartThread, validityEndPeriod, validityEndThread,
    maxGas, rawFee, coins, []);


  generateEvent(`Constructor called`);
  return [];
}

function generateRandomIncrease(base: i64): i64 {

  generateEvent(`base price ${base.toString()}`);
  generateEvent(`Date.now() ${Date.now().toString()}`);
  seed()
  NativeMath.seedRandom(Date.now())
  
  const rand: f64 = NativeMath.random();
  generateEvent(`unsafeRandom ${unsafeRandom().toString()}`);
  generateEvent(`unsafeRandom ${unsafeRandom().toString()}`);
  generateEvent(`generated rand ${rand.toString()}`);
  const increasePercent = (rand - 0.5) * 20 / 100;
  generateEvent(`increasePercent ${increasePercent.toString()}`);
  generateEvent(`round increasePercent ${Math.round(increasePercent).toString()}`);

  const mul = <f64>base * increasePercent;
  generateEvent(`mul ${mul.toString()}`);
  generateEvent(`(Math.round(mul) as i64) ${(Math.round(mul) as i64).toString()}`);

  return base + (Math.round(mul) as i64);
}


export function updatePrice(_: StaticArray<u8>): StaticArray<u8> {

  generateEvent(`Context.timestamp ${Context.timestamp()}`);
  generateEvent(`Context.remainingGas ${Context.remainingGas().toString()}`);

  //TODO restrict access

  let newPrice: i64;
  if (!Storage.has(PRICE_KEY)) {
    generateEvent(`price is not set (Should not happen)`);
    return []
  }
  const currentPrice = Storage.get(PRICE_KEY)
  newPrice = generateRandomIncrease(i64.parse(currentPrice))
  generateEvent(`generated newPrice ${newPrice.toString()}`);
  Storage.set(PRICE_KEY, newPrice.toString())
  generateEvent(`Price updated !`);


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

