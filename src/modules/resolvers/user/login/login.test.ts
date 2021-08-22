import { testFrame } from '../../../../test-utils/testFrame';
import { TestClient } from '../../../../test-utils/TestClient';
import { CustomMessage } from '../../../../shared/CustomMessage.enum';
import { yupErrorResponse } from '../../../../test-utils/yupErrorResponse';
import * as faker from 'faker';
import { RegisterDto } from '../register/register.dto';
import { getRepository } from 'typeorm';
import { User } from '../../../../entity/User';

let client1: TestClient | null = null;

let client2: TestClient | null = null;

const mockData: RegisterDto = {
	email: faker.internet.email(),
	password: faker.internet.password(),
	firstName: faker.internet.userName(),
	lastName: faker.internet.userName(),
	username: faker.internet.userName(),
	phoneNumber: faker.phone.phoneNumber(),
	avatar: '',
};

testFrame(() => {
	beforeAll(async () => {
		client1 = new TestClient();

		client2 = new TestClient();

		await client1.user.register(mockData);
	});

	describe('Login test suite', () => {
		test('account is not verified', async () => {
			await client1?.user
				.login({ email: mockData.email, password: mockData.password })
				.then((res) =>
					expect(res.login).toEqual({
						data: null,
						success: false,
						errors: [
							{
								message: CustomMessage.userEmailIsNotVerified,
								path: 'emailVerified',
							},
						],
					}),
				);
		});
		test('verify account', async () => {
			await getRepository(User).update(
				{ email: mockData.email },
				{ emailVerified: true },
			);

			await getRepository(User)
				.findOne({ where: { email: mockData.email } })
				.then((res) =>
					expect(res).toMatchObject({
						emailVerified: true,
					}),
				);
		});

		test('account is not register', async () => {
			await client1?.user
				.login({
					email: 'tin@email.com',
					password: '123456',
				})
				.then((res) =>
					expect(res.login).toStrictEqual({
						data: null,
						errors: [
							{
								message: CustomMessage.accountIsNotRegister,
								path: 'email',
							},
						],
						success: false,
					}),
				);
		});

		test('[Yup] invalid email address', async () => {
			const data = await client1?.user.login({
				email: 'tin',
				password: '123',
			});
			expect(yupErrorResponse(data)).toEqual({
				message: CustomMessage.inValidEmailAddress,
				path: 'login',
			});
		});

		test('[Yup] password length matched', async () => {
			const data = await client1?.user.login({
				email: 'tin',
				password: '1',
			});
			expect(yupErrorResponse(data)).toEqual({
				message: 'password must be at least 3 characters',
				path: 'login',
			});
		});

		test('password does not matched', async () => {
			const data = await client1?.user.login({
				email: mockData.email,
				password: mockData.password + '123',
			});
			expect(data.login).toMatchObject({
				success: false,
				data: null,
				errors: [
					{
						message: CustomMessage.passwordIsNotMatch,
						path: 'password',
					},
				],
			});
		});

		test('account is not registered', async () => {
			const data = await client1?.user.login({
				email: faker.internet.email(),
				password: mockData.password,
			});
			expect(data.login).toMatchObject({
				success: false,
				data: null,
				errors: [
					{
						message: CustomMessage.accountIsNotRegister,
						path: 'email',
					},
				],
			});
		});

		test('get user before login', async () => {
			const me = await client1?.user.me();
			expect(yupErrorResponse(me)).toEqual({
				message: 'Not authenticated',
				path: 'me',
			});
		});

		test('login works', async () => {
			const data = await client1?.user.login({
				email: mockData.email,
				password: mockData.password,
			});
			expect(data.login).toStrictEqual({
				data: null,
				errors: null,
				success: true,
			});
		});

		test(CustomMessage.userHasLoggedIn, async () => {
			await client1?.user
				.login({
					email: mockData.email,
					password: mockData.password,
				})
				.then((res) =>
					expect(res.login).toMatchObject({
						data: null,
						success: false,
						errors: [
							{
								message: CustomMessage.userHasLoggedIn,
								path: 'login',
							},
						],
					}),
				);
		});

		test('Multi session login works', async () => {
			await client2?.user
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
		});
	});
});
