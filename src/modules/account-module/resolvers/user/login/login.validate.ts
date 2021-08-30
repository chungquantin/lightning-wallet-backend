import * as yup from 'yup';
import { sharedSchema } from 'neutronpay-wallet-common/dist/shared/yupSchema';

export const YUP_LOGIN = yup.object().shape({
	email: sharedSchema.email,
	password: sharedSchema.password,
});
