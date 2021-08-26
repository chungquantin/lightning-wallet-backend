import { testFrame } from '../../../../../common/test-utils/testFrame';
import { TestClient } from '../../../utils/TestClient';
import { yupErrorResponse } from '../../../../../common/test-utils/yupErrorResponse';
import * as faker from 'faker';
import { User } from '../../../entity/User';
import { getRepository } from 'typeorm';
import { RegisterDto } from '../register/register.dto';

let client: TestClient | null = null;

const mockData: RegisterDto = {
	email: faker.internet.email(),
	password: faker.internet.password(),
	firstName: faker.internet.userName(),
	lastName: faker.internet.userName(),
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
			const response = await client?.user.login({
				email: mockData.email,
				password: mockData.password,
			});
			expect(response?.login.success).toBeTruthy();
			const user = await getRepository(User).findOne({
				where: {
					email: mockData.email,
				},
			});

			await client?.user
				.me({
					accessToken: response?.login.data?.accessToken as any,
					refreshToken: response?.login.data?.refreshToken as any,
				})
				.then((res) =>
					expect(res).toStrictEqual({
						errors: null,
						success: true,
						data: {
							email: mockData.email,
							firstName: mockData.firstName,
							id: user?.id,
							emailVerified: false,
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
