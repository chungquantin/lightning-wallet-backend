import { GraphQLClient } from 'graphql-request';
import crossFetch from 'cross-fetch';
import * as GQLModules from '../../graphql';
import { LoginDto } from '../resolvers/user/login/login.dto';
import { RegisterDto } from '../resolvers/user/register/register.dto';
import { GetUserDto } from '../resolvers/user/get_user/get_user.dto';
import { SendForgotPasswordDto } from '../resolvers/user/forgot_password/send_forgot_password_email.dto';
import { ForgotPasswordChangeDto } from '../resolvers/user/forgot_password/forgot_password_change.dto';
interface GQL {
	mutations: any;
	queries: any;
	subscription: any;
}

const GQL: GQL = GQLModules;
export class TestClient {
	private client: GraphQLClient;

	constructor() {
		const fetch = require('fetch-cookie')(crossFetch);
		this.client = new GraphQLClient('http://localhost:8080/graphql', {
			credentials: 'include',
			mode: 'cors',
			fetch,
		});
	}

	private async mutation<T>(
		resolver: string,
		args: T,
		headers?: {
			accessToken: string;
			refreshToken: string;
		},
	) {
		return await this.client
			.request(
				GQL.mutations[resolver],
				{ data: args },
				{
					'x-access-token': headers?.accessToken || '',
					'x-refresh-token': headers?.refreshToken || '',
				},
			)
			.then((data) => data)
			.catch((err) => err);
	}

	private async query<T>(
		resolver: string,
		args?: T,
		headers?: {
			accessToken: string;
			refreshToken: string;
		},
	) {
		return await this.client
			.request(GQL.queries[resolver], args && { data: args }, {
				'x-access-token': headers?.accessToken || '',
				'x-refresh-token': headers?.refreshToken || '',
			})
			.then((data) => data)
			.catch((err) => err);
	}

	user = {
		me: async () => await this.query('me'),

		getUser: async (args: GetUserDto) =>
			await this.query<GetUserDto>('getUser', args),

		getUsers: async () => await this.query('getUsers'),

		logout: async () => await this.mutation('logout', null),

		login: async (args: LoginDto) =>
			await this.mutation<LoginDto>('login', args),

		register: async (args: RegisterDto) =>
			await this.mutation<RegisterDto>('register', args),

		sendForgotPasswordEmail: async (args: SendForgotPasswordDto) =>
			await this.mutation('sendForgotPasswordEmail', args),

		forgotPasswordChange: async (args: ForgotPasswordChangeDto) =>
			await this.mutation('forgotPasswordChange', args),
	};
}
