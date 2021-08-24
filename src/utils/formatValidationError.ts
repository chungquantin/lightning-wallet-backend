import { UserInputError } from 'apollo-server-express';
import { formatYupErrors } from './formatYupErrors';

export const formatValidationError = (err: any) => {
	const validationErrors: any[] =
		err.extensions?.exception?.validationErrors;

	//const errors: any[] = [];
	if (err.message?.name == 'ValidationError') {
		throw new UserInputError(
			JSON.stringify(formatYupErrors(err.message)),
		);
	} else {
		if (validationErrors) {
			validationErrors?.forEach(({ constraints }) => {
				return JSON.stringify({
					path: Object.keys(constraints)?.[0],
					message: constraints[Object.keys(constraints)?.[0]],
				});
			});
		} else {
			return JSON.stringify({
				path: err.extensions.exception.path[0] || 'undefined',
				message: err.message,
			});
		}
		return err;
	}
};
