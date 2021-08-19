import { testFrame } from '../../../../test-utils/testFrame';
import { TestClient } from '../../../../test-utils/TestClient';
import * as faker from 'faker';
import { yupErrorResponse } from '../../../../test-utils/yupErrorResponse';
import { User } from '../../../../entity/User';
import { v4 as uuidV4 } from 'uuid';
import { RegisterDto } from '../register/register.dto';

let client: TestClient | null = null;

const mockData: RegisterDto = {
	email: faker.internet.email(),
	password: faker.internet.password(),
	firstName: faker.internet.userName(),
	lastName: faker.internet.userName(),
	username: faker.internet.userName(),
	phoneNumber: '9798678564',
	avatar: '',
};

testFrame(() => {
	beforeAll(async () => {
		client = new TestClient();
	});

	describe('Get users test suite', () => {
		test('should be invalid id', async () => {
			await client?.user
				.getUser({
					userId: '123',
				})
				.then((res) => {
					expect(yupErrorResponse(res)).toEqual([
						{
							message: 'userId must be a valid UUID',
							path: 'userId',
						},
					]);
				});
		});

		test('should not be found', async () => {
			await client?.user
				.getUser({
					userId: await uuidV4(),
				})
				.then((res) => {
					expect(res.getUser).toStrictEqual({
						data: null,
						errors: [
							{ message: 'User is not Found', path: 'userId' },
						],
						success: false,
					});
				});
		});

		test('should return user', async () => {
			const user = await User.create(mockData).save();
			await client?.user
				.getUser({
					userId: user.id,
				})
				.then((res) => {
					expect(res.getUser).toStrictEqual({
						errors: null,
						success: true,
						data: {
							email: user.email,
							firstName: user.firstName,
							id: user?.id,
							emailVerified: false,
							lastName: user.lastName,
							name: `${user.firstName} ${user.lastName}`,
							password: user?.password,
							avatar: '',
							phoneNumber: user.phoneNumber,
							forgotPasswordLock: false,
							phoneNumberVerified: false,
							twoFactorVerified: false,
							balance: 0,
							defaultCurrency: 'USD',
						},
					});
				});
		});
	});
});
