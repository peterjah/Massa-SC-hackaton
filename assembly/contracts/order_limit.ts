
import { stringToBytes } from '@massalabs/as-types';

import { Storage, Args, toBytes } from "@massalabs/massa-as-sdk";

import { FileSystem, JSONArray } from "fs";


export function execute_limit_order(args: StaticArray<u8>): void {
    let args_deserialized = new Args(args);
    let name = args_deserialized.nextString();
    let orderType = args_deserialized.nextString(); // either "buy" or "sell"
    let price = args_deserialized.nextU32();
    let quantity = args_deserialized.nextU32();
    let limit_price = args_deserialized.nextU32();

    // get the current price of Ethereum
    let current_price = get_current_price();

    if (orderType == "buy") {
        // check if the current price is less than the limit price
        if (current_price < limit_price) {
            // check if the user has enough funds to complete the buy order
            if (check_balance(name, price * quantity)) {
                // execute the buy order
                execute_order(name, "buy", price * quantity);
                // update the user's order history
                update_order_history(name, "buy", price, quantity);
            } else {
                // not enough funds
            }
        } else {
            // the current price is not less than the limit price, don't execute the order
        }
    } else if (orderType == "sell") {
        // check if the current price is greater than the limit price
        if (current_price > limit_price) {
            // check if the user has enough Ethereum to complete the sell order
            if (check_balance(name, quantity)) {
                // execute the sell order
                execute_order(name, "sell", price * quantity);
                // update the user's order history
                update_order_history(name, "sell", price, quantity);
            } else {
                // not enough Ethereum
                // throw an error or return an appropriate error message
            }
        } else {
            // the current price is not greater than the limit price, don't execute the order
            // throw an error or return an appropriate error message
        }
    } else {
        // invalid order type
        // throw an error or return an appropriate error message
    }
}


export function update_order_history(name: string, orderType: string, price: u32, quantity: u32): void {
    let order = new Order(name, orderType, price, quantity, Date.now());
    let order_history = Storage.get(toBytes("order_history"));
    let history: Order[];
    if (order_history.length == 0) {
        history = [];
    } else {
        history = order_history.map(order_bytes => new Order(order_bytes));
    }

    history.push(order);
    Storage.set(toBytes("order_history"), history.map(order => order.serialize()));

    let history_json = JSONArray.stringify(history);

    // Write history to file
    FileSystem.writeFile("order_history.json", history_json, (err) => {
        if (err) {
            console.log(`Error writing to file: ${err}`);
        }
    });
}
