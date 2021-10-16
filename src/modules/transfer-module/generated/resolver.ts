import { DocumentNode } from "graphql";
import request from "graphql-request";
import { loader } from "graphql.macro";
import { PaginationInputType } from "neutronpay-wallet-common/dist/shared";
import { Mutation, Query } from "./code";

export type GQLModules = {
  mutations: {
    [Property in keyof Mutation]: DocumentNode;
  };
  queries: {
    [Property in keyof Query]: DocumentNode;
  };
};

const gqlModules = {
  mutations: {
    /** Lnd */
    checkLightningStatus: loader("./code/mutations/checkLightningStatus.gql"),
    checkOnChainStatus: loader("./code/mutations/checkOnChainStatus.gql"),
  },
  queries: {
    getMyBtcAddress: loader("./code/queries/getMyBtcAddress.gql"),
    getChainInvoice: loader("./code/queries/getChainInvoice.gql"),
    getLightningInvoice: loader("./code/queries/getLightningInvoice.gql"),
  },
};

const Mutations = gqlModules.mutations;
const Queries = gqlModules.queries;

export default class GlobalGraphQLResolver {
  public url;

  constructor(url: string) {
    this.url = url;
  }
  public async mutation<T, A>(
    resolver: keyof typeof Mutations,
    args?: {
      data?: A;
      Pagination?: PaginationInputType;
    },
    headers?: {
      accessToken: string;
      refreshToken: string;
    }
  ): Promise<{ [key in typeof resolver]: T }> {
    console.log(Mutations[resolver.toString()], resolver.toString());
    try {
      const res = await request<{
        [Property in typeof resolver]: T;
      }>(this.url, Mutations[resolver.toString()], args, {
        "x-access-token": headers?.accessToken || "",
        "x-refresh-token": headers?.refreshToken || "",
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  public async query<T, A>(
    resolver: keyof typeof Queries,
    args?: {
      data?: A;
      Pagination?: PaginationInputType;
    },
    headers?: {
      accessToken: string;
      refreshToken: string;
    }
  ): Promise<{ [key in typeof resolver]: T }> {
    try {
      const res = await request<{
        [Property in typeof resolver]: T;
      }>(this.url, Queries[resolver.toString()], args, {
        "x-access-token": headers?.accessToken || "",
        "x-refresh-token": headers?.refreshToken || "",
      });
      return res;
    } catch (error) {
      throw error;
    }
  }
}
