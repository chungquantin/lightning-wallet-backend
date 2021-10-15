export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  _Any: any;
};

export type ApiError = {
  __typename?: 'ApiError';
  message: Scalars['String'];
  path: Scalars['String'];
};

export type BtcAddress = {
  __typename?: 'BtcAddress';
  chainInvoice: ChainInvoiceSchema;
  lightningInvoice: LightningInvoiceSchema;
};

export type BtcAddresses = {
  __typename?: 'BtcAddresses';
  chainInvoices: Array<ChainInvoiceSchema>;
  lightningInvoices: Array<LightningInvoiceSchema>;
};

export type ChainInvoiceSchema = {
  __typename?: 'ChainInvoiceSchema';
  address: Scalars['String'];
  createdAt: Scalars['String'];
  id: Scalars['ID'];
  userId: Scalars['String'];
};

export type CheckLightningStatus = {
  __typename?: 'CheckLightningStatus';
  data?: Maybe<LightningStatusResponse>;
  errors?: Maybe<Array<ApiError>>;
  success: Scalars['Boolean'];
};

export type CheckLightningStatusDto = {
  userId: Scalars['String'];
};

export type CheckOnChainStatus = {
  __typename?: 'CheckOnChainStatus';
  data?: Maybe<OnChainStatusResponse>;
  errors?: Maybe<Array<ApiError>>;
  success: Scalars['Boolean'];
};

export type CheckOnChainStatusDto = {
  amount: Scalars['Float'];
  createdAt: Scalars['Float'];
  txFee: Scalars['Float'];
  userId: Scalars['String'];
};

export type GenerateChainInvoice = {
  __typename?: 'GenerateChainInvoice';
  data?: Maybe<ChainInvoiceSchema>;
  errors?: Maybe<Array<ApiError>>;
  success: Scalars['Boolean'];
};

export type GenerateLightningInvoice = {
  __typename?: 'GenerateLightningInvoice';
  data?: Maybe<LightningInvoiceSchema>;
  errors?: Maybe<Array<ApiError>>;
  success: Scalars['Boolean'];
};

export type GenerateLightningInvoiceDto = {
  amount: Scalars['Float'];
  currency: Scalars['String'];
  description: Scalars['String'];
};

export type GetNodeTransactions = {
  __typename?: 'GetNodeTransactions';
  data: Array<LightningTransaction>;
  errors?: Maybe<Array<ApiError>>;
  success: Scalars['Boolean'];
};

export type LightningInvoiceSchema = {
  __typename?: 'LightningInvoiceSchema';
  addIndex: Scalars['Float'];
  createdAt: Scalars['String'];
  expiresAt: Scalars['String'];
  id: Scalars['ID'];
  payReq: Scalars['String'];
  rHash: Scalars['String'];
  userId: Scalars['String'];
};

export type LightningStatusResponse = {
  __typename?: 'LightningStatusResponse';
  amtPaid: Scalars['Float'];
  amtPaidMsat: Scalars['Float'];
  amtPaidSat: Scalars['Float'];
  cltvExpiry: Scalars['Float'];
  creationDate: Scalars['Float'];
  memo: Scalars['String'];
  paymentRequest: Scalars['String'];
  rHash: Scalars['String'];
  settleDate: Scalars['Float'];
  settled: Scalars['Boolean'];
  value: Scalars['Float'];
};

export type LightningTransaction = {
  __typename?: 'LightningTransaction';
  amount: Scalars['Float'];
  blockHash: Scalars['String'];
  fees: Scalars['Float'];
  hash: Scalars['String'];
  timeStamp: Scalars['Float'];
};

export type Mutation = {
  __typename?: 'Mutation';
  checkLightningStatus?: Maybe<CheckLightningStatus>;
  checkOnChainStatus?: Maybe<CheckOnChainStatus>;
  generateLightningInvoice?: Maybe<GenerateLightningInvoice>;
  generateOnChainInvoice?: Maybe<GenerateChainInvoice>;
};


export type MutationCheckLightningStatusArgs = {
  data: CheckLightningStatusDto;
};


export type MutationCheckOnChainStatusArgs = {
  data: CheckOnChainStatusDto;
};


export type MutationGenerateLightningInvoiceArgs = {
  data: GenerateLightningInvoiceDto;
};

export type OnChainStatusResponse = {
  __typename?: 'OnChainStatusResponse';
  amount: Scalars['Float'];
  status: TransactionStatus;
  timeStamp: Scalars['Float'];
  txHash: Scalars['String'];
};

export type PaginationInputType = {
  limit?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};

export type Query = {
  __typename?: 'Query';
  _entities: Array<Maybe<_Entity>>;
  _service: _Service;
  getBtcAddresses?: Maybe<GetBtcAddresses>;
  getMyBtcAddress?: Maybe<GetBtcAddress>;
  getNodeTransactions?: Maybe<GetNodeTransactions>;
};


export type Query_EntitiesArgs = {
  representations: Array<Scalars['_Any']>;
};


export type QueryGetNodeTransactionsArgs = {
  Pagination?: Maybe<PaginationInputType>;
};

/** Transaction status */
export enum TransactionStatus {
  Expired = 'EXPIRED',
  Paid = 'PAID',
  PartiallyPaid = 'PARTIALLY_PAID',
  Pending = 'PENDING',
  Unpaid = 'UNPAID'
}

export type _Entity = ChainInvoiceSchema | LightningInvoiceSchema;

export type _Service = {
  __typename?: '_Service';
  /** The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied */
  sdl?: Maybe<Scalars['String']>;
};

export type GetBtcAddress = {
  __typename?: 'getBtcAddress';
  data?: Maybe<BtcAddress>;
  errors?: Maybe<Array<ApiError>>;
  success: Scalars['Boolean'];
};

export type GetBtcAddresses = {
  __typename?: 'getBtcAddresses';
  data?: Maybe<BtcAddresses>;
  errors?: Maybe<Array<ApiError>>;
  success: Scalars['Boolean'];
};
