import { User } from '../entity/User';

export const forgotPasswordLockAccount = async (userId: string) => {
	// can't login
	await User.update({ id: userId }, { forgotPasswordLock: true });
};
