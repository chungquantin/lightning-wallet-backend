import { DocumentNode } from "@apollo/client/core";
import axios, { AxiosRequestConfig } from "axios";
import request from "graphql-request";
import { PaginationInputType } from "neutronpay-wallet-common/dist/shared";
import { Query } from "typeorm/driver/Query";
import { Mutation } from "../generated/graphql";

export class ExchangeRateApi {
  baseURL: string = "https://api.sendwyre.com/v3/";

  get(endpoint: string, options?: AxiosRequestConfig) {
    return axios.get(`${this.baseURL}${endpoint}`, options);
  }

  post(endpoint: string, options?: AxiosRequestConfig) {
    return axios.post(`${this.baseURL}${endpoint}`, options);
  }

  async getRates() {
    return await (
      await this.get(`rates`)
    ).data;
  }

  get exchangeRate() {
    return {
      btcUSD: async () => {
        const rates = await this.getRates();
        return rates["BTCUSD"];
      },

      btcVND: async () => {
        const rates = await this.getRates();
        return rates["BTCVND"];
      },

      btcCAD: async () => {
        const rates = await this.getRates();
        return rates["BTCCAD"];
      },

      usdBTC: async () => {
        const rates = await this.getRates();
        return 1 / rates["BTCUSD"];
      },

      vndBTC: async () => {
        const rates = await this.getRates();
        return 1 / rates["BTCVND"];
      },

      cadBTC: async () => {
        const rates = await this.getRates();
        return 1 / rates["BTCCAD"];
      },

      usdVND: async () => {
        const rates = await this.getRates();
        return rates["BTCVND"] / rates["BTCUSD"];
      },

      usdCAD: async () => {
        const rates = await this.getRates();
        return rates["BTCCAD"] / rates["BTCUSD"];
      },
    };
  }
}

interface GQL {
  mutations: {
    [Property in keyof Mutation]: DocumentNode;
  };
  queries: {
    [Property in keyof Query]: DocumentNode;
  };
}
