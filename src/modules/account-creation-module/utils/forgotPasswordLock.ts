import { User } from '../entity/User';

export const forgotPasswordLockAccount = async (userId: string) => {
	// can't login
	console.log(userId);
	await User.update({ id: userId }, { forgotPasswordLock: true });
};
