import * as yup from 'yup';
import { sharedSchema } from 'neutronpay-wallet-common/dist/shared/yupSchema';

export const YUP_CHANGE_PASSWORD = yup.object().shape({
	key: yup.string(),
	newPassword: sharedSchema.password,
});
