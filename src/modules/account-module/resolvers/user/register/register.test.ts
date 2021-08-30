import { testFrame } from 'neutronpay-wallet-common/dist/test-utils/testFrame';
import { TestClient } from '../../../utils/TestClient';
import { CustomMessage } from 'neutronpay-wallet-common/dist/shared/CustomMessage.enum';
import { yupErrorResponse } from 'neutronpay-wallet-common/dist/test-utils/yupErrorResponse';
import * as faker from 'faker';
import { getRepository } from 'typeorm';
import { User } from '../../../entity/User';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './register.dto';

let client: TestClient | null = null;

const mockData: RegisterDto = {
	email: faker.internet.email(),
	password: faker.internet.password(),
	firstName: faker.internet.userName(),
	lastName: faker.internet.userName(),
	phoneNumber: '123456789123',
	avatar: '',
};

testFrame(() => {
	beforeAll(async () => {
		client = new TestClient();
	});

	describe('Register test suite', () => {
		test('register works', async () => {
			const data = await client?.user.register(mockData);

			expect(data?.register).toStrictEqual({
				data: null,
				errors: null,
				success: true,
			});

			const user = await getRepository(User).findOne({
				where: {
					email: mockData.email,
				},
			});

			await getRepository(User).update(
				{
					email: mockData.email,
				},
				{
					emailVerified: true,
				},
			);

			expect(user).toBeDefined();

			expect({
				email: user?.email,
				firstName: user?.firstName,
				lastName: user?.lastName,
				phoneNumber: user?.phoneNumber,
			}).toStrictEqual({
				email: mockData.email,
				firstName: mockData.firstName,
				lastName: mockData.lastName,
				phoneNumber: user?.phoneNumber,
			});
			const isPasswordMatched = await bcrypt.compare(
				mockData.password,
				user?.password as string,
			);
			expect(isPasswordMatched).toBe(true);
		});

		test('login to registered account', async () => {
			const data = await client?.user.login({
				email: mockData.email,
				password: mockData.password,
			});
			expect(data?.login.success).toBeTruthy();
		});

		test('[Yup] email is not valid', async () => {
			const data = await client?.user.register({
				...mockData,
				email: 'tin',
			});
			expect(yupErrorResponse(data)).toEqual({
				message: CustomMessage.inValidEmailAddress,
				path: 'register',
			});
		});

		test('[Yup] password length matched', async () => {
			const data = await client?.user.register({
				...mockData,
				email: faker.internet.email(),
				password: '1',
			});
			expect(yupErrorResponse(data)).toEqual({
				message: 'password must be at least 3 characters',
				path: 'register',
			});
		});
	});

	test('[Yup] firstName & lastName length match', async () => {
		const data = await client?.user.register({
			email: faker.internet.email(),
			password: faker.internet.password(),
			firstName: '',
			lastName: '',
			phoneNumber: '1231231231',
			avatar: '',
		});
		expect(yupErrorResponse(data)).toEqual({
			message: 'lastName must be at least 3 characters',
			path: 'register',
		});
	});

	test('[Yup] phoneNumber length match', async () => {
		const data = await client?.user.register({
			...mockData,
			email: faker.internet.email(),
			phoneNumber: '1'.repeat(30),
		});
		expect(yupErrorResponse(data)).toEqual({
			message: 'phoneNumber must be at most 20 characters',
			path: 'register',
		});
	});

	test('[Yup] phoneNumber has been taken', async () => {
		const data = await client?.user.register({
			...mockData,
			email: faker.internet.email(),
		});
		expect(data?.register).toEqual({
			data: null,
			success: false,
			errors: [
				{
					message: CustomMessage.phoneNumberIsTaken,
					path: 'phoneNumber',
				},
			],
		});
	});
});
