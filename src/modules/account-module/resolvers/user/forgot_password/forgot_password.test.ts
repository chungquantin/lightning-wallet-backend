import * as faker from 'faker';
import { User } from '../../../entity/User';
import { CustomMessage } from 'neutronpay-wallet-common/dist/shared/CustomMessage.enum';
import { TestClient } from '../../../utils/TestClient';
import { testFrame } from 'neutronpay-wallet-common/dist/test-utils/testFrame';
import { RegisterDto } from '../register/register.dto';

let client: TestClient | null = null;
let user: User | null = null;

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

    user = await User.create(mockData).save();
  });

  describe('Send forgot password test suite', () => {
    test('user is not found', async () => {
      const res = await client ?.user.sendForgotPasswordEmail({
        email: faker.internet.email(),
      });

      expect(res.sendForgotPasswordEmail).toMatchObject({
        success: false,
        data: null,
        errors: [
          {
            message: CustomMessage.userIsNotFound,
            path: 'email',
          },
        ],
      });
    });

    //test('send email works', async () => {
    //	const res = await client?.user.sendForgotPasswordEmail({
    //		email: mockData.email,
    //	});

    //	expect(res).toStrictEqual({
    //		data: null,
    //		errors: null,
    //		success: true,
    //	});

    //	expect(user?.forgotPasswordLock).toBe(false);
    //});
  });
  //TODO test password lock
  // describe("Forgot password change test suite", () => {});
});
