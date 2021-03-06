import { testFrame } from 'neutronpay-wallet-common/dist/test-utils/testFrame';
import { TestClient } from '../../../utils/TestClient';
import { yupErrorResponse } from 'neutronpay-wallet-common/dist/test-utils/yupErrorResponse';
import * as faker from 'faker';
import { RegisterDto } from '../register/register.dto';
import { getRepository } from 'typeorm';
import { User } from '../../../entity/User';

let client: TestClient | null = null;

const mockData: RegisterDto = {
	email: faker.internet.email(),
	password: faker.internet.password(),
	firstName: faker.internet.userName(),
	lastName: faker.internet.userName(),
	phoneNumber: '1236187246',
	avatar: '',
};

testFrame(() => {
	beforeAll(async () => {
		client = new TestClient();
		await getRepository(User)
			.create({ ...mockData, emailVerified: true })
			.save();
	});

	describe('Logout test suite', () => {
		test('logout before login', async () => {
			await client?.user.logout().then((res) =>
				expect(yupErrorResponse(res)).toMatchObject({
					message: 'Not authenticated',
					path: 'logout',
				}),
			);
		});

		test('login to account', async () => {
			const response = await client?.user.login({
				email: mockData.email,
				password: mockData.password,
			});
			expect(response?.login).toStrictEqual({
				data: {
					accessToken: response?.login.data?.accessToken,
					refreshToken: response?.login.data?.refreshToken,
				},
				errors: null,
				success: true,
			});
		});

		test('logout works', async () => {
			await client?.user
				.logout()
				.then((res) => expect(res.logout).toBeNull);

			await client?.user.getCurrentUser().then((res) =>
				expect(yupErrorResponse(res)).toMatchObject({
					message: 'Not authenticated',
					path: 'me',
				}),
			);
		});
	});
});
