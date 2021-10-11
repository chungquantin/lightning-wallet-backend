import axios, { AxiosRequestConfig } from "axios";
import { EnvironmentType } from "neutronpay-wallet-common";

export class ExchangeRateApi {
  baseURL: string = "https://api.sendwyre.com/v3/";

  get(endpoint: string, options?: AxiosRequestConfig) {
    return axios.get(`${this.baseURL}${endpoint}`, options);
  }

  post(endpoint: string, options?: AxiosRequestConfig) {
    return axios.post(`${this.baseURL}${endpoint}`, options);
  }

  async getRates() {
    return await (await this.get(`rates`)).data;
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
      }
    };
  }
}

export class PrimeTrustApi {
  private sandBoxURL: string = "";
  private productionURL: string = "";

  private apiUrl: string =
    process.env.NODE_ENV === EnvironmentType.DEV
      ? this.sandBoxURL
      : this.productionURL;
}
