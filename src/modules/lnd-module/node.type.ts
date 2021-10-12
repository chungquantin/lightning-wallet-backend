import * as grpc from "@grpc/grpc-js";
import {
  AddInvoiceResponse,
  GetInfoRequest,
  GetInfoResponse,
  GetTransactionsRequest,
  ListInvoiceRequest,
  ListInvoiceResponse,
  ListPaymentsRequest,
  ListPaymentsResponse,
  NewAddressRequest,
  NewAddressResponse,
  SendCoinsRequest,
  SendCoinsResponse,
  SendManyRequest,
  SendManyResponse,
  SendRequest,
  SendResponse,
  Transaction,
  TransactionDetails,
  WalletBalanceRequest,
  WalletBalanceResponse,
} from "./proto/lnd_pb";

export interface ILightningRPCServer extends grpc.Client {
  GetTransactions: (
    call?: Partial<GetTransactionsRequest.AsObject>,
    callback?: grpc.sendUnaryData<any>
  ) => any;
  WalletBalance: (
    call?: Partial<WalletBalanceRequest.AsObject>,
    callback?: grpc.sendUnaryData<WalletBalanceResponse.AsObject>
  ) => any;
  GetInfo: (
    call?: Partial<GetInfoRequest.AsObject>,
    callback?: grpc.sendUnaryData<GetInfoResponse.AsObject>
  ) => any;
  newAddress: (
    call?: Partial<NewAddressRequest.AsObject>,
    callback?: grpc.sendUnaryData<NewAddressResponse.AsObject>
  ) => any;
  ListInvoices: (
    call?: Partial<ListInvoiceRequest.AsObject>,
    callback?: grpc.sendUnaryData<ListInvoiceResponse.AsObject>
  ) => any;
  SendCoins: (
    call?: Partial<SendCoinsRequest.AsObject>,
    callback?: grpc.sendUnaryData<SendCoinsResponse.AsObject>
  ) => any;
  SendPaymentSync: (
    call?: Partial<SendRequest.AsObject>,
    callback?: grpc.sendUnaryData<SendResponse.AsObject>
  ) => any;
  ListPayments: (
    call?: Partial<ListPaymentsRequest.AsObject>,
    callback?: grpc.sendUnaryData<ListPaymentsResponse.AsObject>
  ) => any;
  AddInvoice: (
    call?: any,
    callback?: grpc.sendUnaryData<AddInvoiceResponse.AsObject>
  ) => any;
  SendMany: (
    call?: Partial<SendManyRequest.AsObject>,
    callback?: grpc.sendUnaryData<SendManyResponse.AsObject>
  ) => any;
  LookupInvoice: (call?: any, callback?: any) => any;
  SubscribeTransactions: (call?: any, callback?: any) => any;
  SubscribeInvoices: (call?: any, callback?: any) => any;
}
