import { testFrame } from '../../../../../test-utils/testFrame';
import { TestClient } from '../../../utils/TestClient';
import * as faker from 'faker';
import { User } from '../../../entity/User';
import { RegisterDto } from '../register/register.dto';
import { lorem } from 'faker';

let client: TestClient | null = null;

const mockData: RegisterDto = {
	email: faker.internet.email(),
	password: faker.internet.password(),
	firstName: faker.internet.userName(),
	lastName: faker.internet.userName(),
	phoneNumber: '12312312421',
	avatar: '',
};

testFrame(() => {
	beforeAll(async () => {
		client = new TestClient();
	});

	describe('Get user test suite', () => {
		test('should return empty array', async () => {
			await client?.user.getUsers().then((res) => {
				expect(res.getUsers.data).toHaveLength(0);
			});
		});
		test('should have 1 user', async () => {
			const user = await User.create(mockData).save();

			await client?.user.getUsers().then((res) => {
				expect(res.getUsers.data).toHaveLength(1);
				expect(res.getUsers).toStrictEqual({
					errors: null,
					success: true,
					data: [
						{
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
					],
				});
			});
		});
	});
});
