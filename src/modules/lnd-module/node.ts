import { config } from "./config";
import * as fs from "fs";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as moment from "moment";
import { ILightningRPCServer } from "./node.type";
import {
  AddInvoiceResponse,
  GetInfoResponse,
  ListInvoiceResponse,
  ListPaymentsResponse,
  NewAddressResponse,
  SendCoinsResponse,
  SendManyRequest,
  SendManyResponse,
  SendRequest,
  SendResponse,
  TransactionDetails,
  WalletBalanceResponse,
} from "./proto/lnd_pb";

process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

// Lnd admin macaroon is at ~/.lnd/data/chain/bitcoin/simnet/admin.macaroon on Linux and
// ~/Library/Application Support/Lnd/data/chain/bitcoin/simnet/admin.macaroon on Mac
const m = fs.readFileSync(__dirname + "/admin.macaroon");
const macaroon = m.toString("hex");

// build meta data credentials
const metadata = new grpc.Metadata();
metadata.add("macaroon", macaroon);
const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
  (_args, callback) => {
    callback(null, metadata);
  }
);

// build ssl credentials using the cert the same as before
const lndCert: Buffer = fs.readFileSync(__dirname + "/tls.cert");
const sslCreds = grpc.credentials.createSsl(lndCert);

// combine the cert credentials and the macaroon auth credentials
// such that every call is properly encrypted and authenticated
const credentials: grpc.ChannelCredentials =
  grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

// Pass the crendentials when creating a channel
const packageDefinition = protoLoader.loadSync(__dirname + "/proto/lnd.proto");
const lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
const lnrpc: any = lnrpcDescriptor.lnrpc;
const client: ILightningRPCServer = new lnrpc.Lightning(
  "165.232.151.71:10009",
  credentials,
  { "grpc.max_receive_message_length": 50 * 1024 * 1024 }
);

export const GetTransactions = function () {
  return new Promise<TransactionDetails.AsObject | null>((resolve, reject) => {
    client.GetTransactions({}, (err, res) => {
      if (!err) {
        resolve(res);
      } else {
        reject(err);
      }
    });
  });
};

export const WalletBalance = function () {
  return new Promise<WalletBalanceResponse.AsObject | null | undefined>(
    (resolve, reject) => {
      client.WalletBalance({}, (err, res) => {
        console.log("WalletBalance", res, err);
        if (!err) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  );
};

export const GetInfo = function () {
  return new Promise<GetInfoResponse.AsObject | null | undefined>(
    (resolve, reject) => {
      client.GetInfo({}, (err, res) => {
        console.log("GetInfo", res, err);
        if (!err) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  );
};

export const NewAddress = function () {
  return new Promise<NewAddressResponse.AsObject | null | undefined>(
    (resolve, reject) => {
      client.newAddress({ type: 1 }, (err, res) => {
        console.log(res, err);
        if (!err) {
          // log('NewAddress subscribeTransactions')
          // subscribeTransactions()
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  );
};

export const ListInvoices = function () {
  return new Promise<ListInvoiceResponse.AsObject | null | undefined>(
    (resolve, reject) => {
      client.ListInvoices({}, (err, res) => {
        console.log(res, err);
        if (!err) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  );
};

// exports.SubscribeTransactions = function () {
//   const call = client.SubscribeTransactions({})
//   call.on('data', (response) => {
//     log(response)
//   })
//   call.on('status', (status) => {
//     log(status)
//   })
//   call.on('end', () => {
//     log('end')
//   })
// }

/**
 * Send Coins on-chain
 * @param {string} address On-chain address
 * @param {int64} amount Amount in sats
 */
export const SendCoins = function (address: string, amount: number) {
  const parameters = {
    addr: address,
    amount: amount,
    sat_per_vbyte: 30,
  };
  console.log("sendCoins", parameters);
  return new Promise<SendCoinsResponse.AsObject | null | undefined>(
    (resolve, reject) => {
      client.SendCoins(parameters, (err, res) => {
        console.log(res, err);
        if (!err) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  );
};

export const SendPayment = function ({ payment_request }) {
  const parameters: Pick<SendRequest.AsObject, "payment_request"> = {
    payment_request,
  };
  return new Promise<SendResponse.AsObject | null | undefined>(
    (resolve, reject) => {
      console.log("SendPaymentSync", parameters);
      client.SendPaymentSync(parameters, (err, res) => {
        console.log(res, err);
        if (!err) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  );
};

export const ListPayments = function () {
  return new Promise<ListPaymentsResponse.AsObject | null | undefined>(
    (resolve, reject) => {
      client.ListPayments({}, (err, res) => {
        console.log(res, err);
        if (!err) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  );
};

export const AddInvoice = function (description, value) {
  return new Promise<AddInvoiceResponse.AsObject | null | undefined>(
    (resolve, reject) => {
      const parameters = {
        memo: description, // An optional memo to attach along with the invoice. Used for record keeping purposes for the invoice’s creator, and will also be set in the description field of the encoded payment request if the description_hash field is not being used.
        value: value, // The value of this invoice in satoshis
        creation_date: moment().unix(),
        expiry: config.invoiceExpiry, // Payment request expiry time in seconds. Default is 3600 (1 hour).
      };
      client.AddInvoice(parameters, (err, res) => {
        console.log(res, err);
        if (!err) {
          // log('LookupInvoice subscribeInvoices')
          // subscribeInvoices()
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  );
};

export const LookupInvoice = (r_hash) => {
  return new Promise((resolve, reject) => {
    const parameters = {
      r_hash: r_hash,
    };
    client.LookupInvoice(parameters, (err, res) => {
      // log(res, err)
      if (!err) {
        resolve(res);
      } else {
        reject(err);
      }
    });
  });
};

export const SubscribeInvoices = () => {
  let request = {
    settle_index: 1,
  };
  console.log("subscribeInvoices", request);
  let call = client.SubscribeInvoices(request);
  call.on("data", async (response) => {
    // A response was received from the server.
    console.log("subscribeInvoices data", response);
    if (response.settled) {
      console.log("subscribeInvoices settled");
      // await db.collection('subscribeInvoices').doc(response.add_index).set(response, {  merge: true })
      // const checkouts = require('./checkouts')
      // await checkouts.statusTransactionLightning(response.add_index, response.creation_date, response.expiry, response.memo)
    }
  });
  call.on("status", (status) => {
    // The current status of the stream.
    console.log("subscribeInvoices status", status);
  });
  call.on("end", () => {
    // The server has closed the stream.
    console.log("subscribeInvoices end");
  });
};

export const SubscribeTransactions = () => {
  let request = {};
  console.log("subscribeTransactions", request);
  let call = client.SubscribeTransactions(request);
  call.on("data", async (response) => {
    // A response was received from the server.
    console.log("subscribeTransactions data", response);
    if (response.amount.substring(0, 1) !== "-") {
      console.log(response.amount, response.dest_addresses);
      // await db.collection('subscribeTransactions').doc(response.tx_hash).set(response, {  merge: true })
      // const checkouts = require('./checkouts')
      // await checkouts.statusTransactionOnChain(response.dest_addresses)
    }
  });
  call.on("status", (status) => {
    // The current status of the stream.
    console.log("subscribeTransactions status", status);
  });
  call.on("end", () => {
    // The server has closed the stream.
    console.log("subscribeTransactions end");
  });
};

/**
 * Send Coins on-chain
 * @param {*} addrToAmountEntries On-chain address
 * @return {Promise<any>}
 */
export const SendMany = function (addrToAmountEntries) {
  const parameters: Partial<SendManyRequest.AsObject> = {
    addrtoamountMap: addrToAmountEntries,
    satPerByte: 20,
  };
  console.log("SendMany", parameters);
  return new Promise<SendManyResponse.AsObject | null | undefined>(
    (resolve, reject) => {
      client.SendMany(parameters, (err, res) => {
        console.log(res, err);
        if (!err) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  );
};
