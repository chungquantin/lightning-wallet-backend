import { GraphQLClient } from "graphql-request";
import crossFetch from "cross-fetch";
import * as GQLModules from "../graphql";
import { LoginDto } from "../resolvers/user/login/login.dto";
import { RegisterDto } from "../resolvers/user/register/register.dto";
import { GetUserDto } from "../resolvers/user/get_user/get_user.dto";
import { SendForgotPasswordDto } from "../resolvers/user/forgot_password/send_forgot_password_email.dto";
import { ForgotPasswordChangeDto } from "../resolvers/user/forgot_password/forgot_password_change.dto";
import { ApiLoginResponseType } from "../resolvers/user/login/login.resolver";
import { ApiRegisterResponseType } from "../resolvers/user/register/register.resolver";
import { ApiUsersResponseType } from "../resolvers/user/get_users/get_users.resolver";
import { ApiUserResponseType } from "../resolvers/user/get_user/get_user.resolver";
import { ApiGetCurrentUserResponseType } from "../resolvers/user/get_current_user/get_current_user.resolver";
import { ApiLogoutResponseType } from "../resolvers/user/logout/logout.resolver";
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
      fetch
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
          "x-refresh-token": headers?.refreshToken || ""
        }
      )
      .then(data => data)
      .catch(err => err);
  }

  private async query<T>(resolver: string, args?: T, headers?: RequestHeader) {
    return await this.client
      .request(GQL.queries[resolver], args && { data: args }, {
        "x-access-token": headers?.accessToken || "",
        "x-refresh-token": headers?.refreshToken || ""
      })
      .then(data => data)
      .catch(err => err);
  }

  user = {
    getCurrentUser: async (
      headers?: RequestHeader
    ): Promise<{ getCurrentUser: ApiGetCurrentUserResponseType }> =>
      await this.query("getCurrentUser", headers),

    getUser: async (
      args: GetUserDto,
      headers?: RequestHeader
    ): Promise<{ getUser: ApiUserResponseType }> =>
      await this.query<GetUserDto>("getUser", args, headers),

    getUsers: async (): Promise<{ getUsers: ApiUsersResponseType }> =>
      await this.query("getUsers"),

    logout: async (): Promise<{ logout: ApiLogoutResponseType }> =>
      await this.mutation("logout", null),

    login: async (
      args: LoginDto,
      headers?: RequestHeader
    ): Promise<{ login: ApiLoginResponseType }> =>
      await this.mutation<LoginDto>("login", args, headers),

    register: async (
      args: RegisterDto,
      headers?: RequestHeader
    ): Promise<{ register: ApiRegisterResponseType }> =>
      await this.mutation<RegisterDto>("register", args, headers),

    sendForgotPasswordEmail: async (
      args: SendForgotPasswordDto,
      headers?: RequestHeader
    ) => await this.mutation("sendForgotPasswordEmail", args, headers),

    forgotPasswordChange: async (
      args: ForgotPasswordChangeDto,
      headers?: RequestHeader
    ) => await this.mutation("forgotPasswordChange", args)
  };
}
