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
import { Args, bytesToU64, i64ToBytes, stringToBytes, u64ToBytes } from '@massalabs/as-types';

const PRICE_KEY = stringToBytes('PRICE_KEY');
const INIT_PRICE: u64 = 1000;

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
  Storage.set(PRICE_KEY, u64ToBytes(INIT_PRICE) )

  generateEvent(`Constructor called`);
  return [];
}


export function updatePrice(argBytes: StaticArray<u8>): StaticArray<u8> {

  //TODO restrict access

  if (!Storage.has(PRICE_KEY)) {
    generateEvent(`price is not set (Should not happen)`);
    return []
  }
  const newPrice = new Args(argBytes).nextU64().expect("unwrapping u64")
  Storage.set(PRICE_KEY, u64ToBytes(newPrice))
  generateEvent(`Price updated to ${newPrice.toString()}!`);


  return i64ToBytes(newPrice)
}


export function getPrice(_: StaticArray<u8>): StaticArray<u8> {
  generateEvent(`getPrice func`);

  if (!Storage.has(PRICE_KEY)) {
    generateEvent(`price is not set`);
    return []
  }

  const price = Storage.get(PRICE_KEY)
  generateEvent(`current price is ${bytesToU64(price).toString()}`);

  return price
}

