// The entry file of your WebAssembly module.
import {
  callerHasWriteAccess,
  currentPeriod,
  generateEvent,
  Context,
  sendMessage,
  balance,
  balanceOf
} from '@massalabs/massa-as-sdk';
import { stringToBytes } from '@massalabs/as-types';

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

  // Setup the 'message' we will send to our deployed SC
  const functionName = "event"
  const address = Context.callee();

  const current_period = currentPeriod();
  const validityStartPeriod = current_period + 1;
  const validityStartThread = 1 as u8;
  const validityEndPeriod = current_period + 100;
  const validityEndThread = 1 as u8;
  const maxGas = 1_000_000_000; // gas for smart contract execution
  const rawFee = 0;
  const coins = 100; // coins that can be used inside SC
  const msg = stringToBytes("hello my good friend!");

  // Send the message
  sendMessage(address, functionName,
    validityStartPeriod, validityStartThread, validityEndPeriod, validityEndThread,
    maxGas, rawFee, coins, msg);


  generateEvent(`Constructor called`);
  return [];
}

/**
 * @param _ - not used
 * @returns the emitted event serialized in bytes
 */
export function event(_: StaticArray<u8>): StaticArray<u8> {
  const message = "I'm an event!";
  generateEvent(message);
  return stringToBytes(message);
}
