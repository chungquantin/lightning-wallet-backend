import { registerEnumType } from "type-graphql";

export enum TransactionStatus {
  UNPAID = "UNPAID",
  PENDING = "PENDING",
  PAID = "PAID",
  EXPIRED = "EXPIRED",
  PARTIALLY_PAID = "PARTIALLY_PAID",
}

registerEnumType(TransactionStatus, {
  name: "TransactionStatus", // this one is mandatory
  description: "Transaction status", // this one is optional
});
