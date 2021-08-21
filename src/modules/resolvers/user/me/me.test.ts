import { testFrame } from '../../../../test-utils/testFrame';
import { TestClient } from '../../../../test-utils/TestClient';
import { yupErrorResponse } from '../../../../test-utils/yupErrorResponse';
import * as faker from 'faker';
import { User } from '../../../../entity/User';
import { getRepository } from 'typeorm';
import { RegisterDto } from '../register/register.dto';

let client: TestClient | null = null;

const mockData: RegisterDto = {
	email: faker.internet.email(),
	password: faker.internet.password(),
	firstName: faker.internet.userName(),
	lastName: faker.internet.userName(),
	username: faker.internet.userName(),
	phoneNumber: '091723127312',
	avatar: '',
};

testFrame(() => {
	beforeAll(async () => {
		client = new TestClient();
		await getRepository(User)
			.create({
				...mockData,
				emailVerified: true,
			})
			.save();
	});

	describe('Me test suite', () => {
		test('get current user before login', async () => {
			await client?.user.me().then((res) =>
				expect(yupErrorResponse(res)).toMatchObject({
					message: 'Not authenticated',
					path: 'me',
				}),
			);
		});
		test('get current user after login', async () => {
			await client?.user
				.login({
					email: mockData.email,
					password: mockData.password,
				})
				.then((res) =>
					expect(res.login).toStrictEqual({
						data: null,
						errors: null,
						success: true,
					}),
				);
			const user = await getRepository(User).findOne({
				where: {
					email: mockData.email,
				},
			});
			await client?.user.me().then((res) =>
				expect(res.me).toStrictEqual({
					errors: null,
					success: true,
					data: {
						email: mockData.email,
						firstName: mockData.firstName,
						id: user?.id,
						emailVerified: true,
						lastName: mockData.lastName,
						name: `${mockData.firstName} ${mockData.lastName}`,
						password: user?.password,
						avatar: '',
						phoneNumber: mockData.phoneNumber,
						forgotPasswordLock: false,
						phoneNumberVerified: false,
						twoFactorVerified: false,
						balance: 0,
						defaultCurrency: 'USD',
					},
				}),
			);
		});
	});
});
