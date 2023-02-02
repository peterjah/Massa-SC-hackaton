let massa = window.massa;


// create a base account for signing transactions
const baseAccount = {
    address: 'A12irbDfYNwyZRbnpBrfCBPCxrktp8f8riK2sQddWbzQ3g43G7bb',
    secretKey: '',
    publicKey: 'P1kKfgrCveVnosUkxTzaBw5cf9f2cbTvK3R5Ssb2Pf76au8xwmH'
};

let client = null

const oracle_addr = "A127azcRysbtMYCYuFr1ztbbjstymkr3mxaPhxBrwn4JhDrt11yx"

// initialize a testnet client
massa.ClientFactory.createDefaultClient(
  "http://145.239.66.206:33035",
  false,
  baseAccount
).then((c) => client = c);

let Args = massa.Args;

function getActualPrice() {
  var asset = document.getElementById("asset").value;
  var action = document.querySelector('input[name="action"]:checked').value;
  var priceLimit = document.getElementById("priceLimit").value;
  var validityDate = document.getElementById("validityDate").value;

  console.log("Asset: " + asset);
  console.log("Action: " + action);
  console.log("Price Limit: " + priceLimit);
  console.log("Date of Validity: " + validityDate);
}

function submitOrder() {
  var asset = document.getElementById("asset").value;
  var action = document.querySelector('input[name="action"]:checked').value;
  var priceLimit = document.getElementById("priceLimit").value;
  var validityDate = document.getElementById("validityDate").value;

  console.log("Asset: " + asset);
  console.log("Action: " + action);
  console.log("Price Limit: " + priceLimit);
  console.log("Date of Validity: " + validityDate);
  document.getElementById("waitingorder").innerHTML = "Waiting For Order To Be Executed ..."
  
}
// function getPrice() {
//   document.getElementById("price").innerHTML = 1700;
// }

// function strEncodeUTF16(str) {
//     var buf = new ArrayBuffer(str.length*2);
//     var bufView = new Uint8Array(buf);
//     for (var i=0, strLen=str.length * 2; i < strLen; i += 2) {
//       bufView[i] = str.charCodeAt(i / 2);
//       bufView[i + 1] = 0;
//     }
//     return bufView;
// }

// function load() {
//     if (client) {
//         client.publicApi().getDatastoreEntries([{ key: strEncodeUTF16("alice"), address: sc_addr }]).then((res) => {
//             console.log(res)
//             if (res[0].candidate_value) {
//                 let age_decode = new Args(res[0].candidate_value);
//                 let age = age_decode.nextU32();
//                 document.getElementById("price").innerHTML = 1700;
//             }
//         });
//     }
// }

function getPrice(number) {
  if (client) {
    client.smartContracts().readSmartContract({
      fee: 0,
      maxGas: 700000,
      targetAddress: oracle_addr,
      targetFunction: "getPrice",
      parameter: new Args().serialize(),
    }).then((data) => {
      const view = new DataView(new Uint8Array(data[0].result.Ok).buffer );
      const val = view.getBigUint64(0, true).toString()
      console.log("fetched new price", val) ;
      document.getElementById("price").innerHTML = val;


    })

  }
}
function waitForOrder() {
document.getElementById("order").innerHTML = "DONE, your order has been exectued at price ".concat(val).concat(" !");
}

setInterval(getPrice, 1000);
// function initialize() {
//     let args = new Args();
//     if (client) {
//         client.smartContracts().callSmartContract({
//             fee: 0,
//             maxGas: 2000000,
//             coins: 1_000_000_000,
//             targetAddress: sc_addr,
//             functionName: "initialize",
//             parameter: args.serialize()
//         },baseAccount).then((res) => {
//             console.log(res)
//         });
//     }
// }
