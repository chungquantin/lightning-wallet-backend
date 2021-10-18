import { GraphQLClient } from "graphql-request";
import crossFetch from "cross-fetch";
import * as GQLModules from "../generated/code";
interface GQL {
  mutations: any;
  queries: any;
  subscription: any;
}

interface RequestHeader {
  accessToken: string;
  refreshToken: string;
}

const GQL: GQL = GQLModules;
export class TestClient {
  private client: GraphQLClient;

  constructor() {
    const fetch = require("fetch-cookie")(crossFetch);
    this.client = new GraphQLClient("http://localhost:8080/graphql", {
      credentials: "include",
      mode: "cors",
      fetch,
    });
  }

  private async mutation<T>(
    resolver: string,
    args: T,
    headers?: {
      accessToken: string;
      refreshToken: string;
    }
  ) {
    return await this.client
      .request(
        GQL.mutations[resolver],
        { data: args },
        {
          "x-access-token": headers?.accessToken || "",
          "x-refresh-token": headers?.refreshToken || "",
        }
      )
      .then((data) => data)
      .catch((err) => err);
  }

  private async query<T>(resolver: string, args?: T, headers?: RequestHeader) {
    return await this.client
      .request(GQL.queries[resolver], args && { data: args }, {
        "x-access-token": headers?.accessToken || "",
        "x-refresh-token": headers?.refreshToken || "",
      })
      .then((data) => data)
      .catch((err) => err);
  }
}
