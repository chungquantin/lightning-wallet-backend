import { ApiResponse } from '../shared';
import { formatYupErrors } from './formatYupErrors';

export const formatValidationError = (err: any) => {
	const validationErrors: any[] =
		err.extensions?.exception?.validationErrors;
	//const errors: any[] = [];
	if (err.message?.name == 'ValidationError') {
		return formatYupErrors(err.message);
	} else {
		if (validationErrors) {
			validationErrors?.forEach(({ constraints }) => {
				return {
					path: Object.keys(constraints)?.[0],
					message: constraints[Object.keys(constraints)?.[0]],
				};
			});
		} else {
			return {
				path: err.path?.[0] || 'undefined',
				message: err.message,
			};
		}
		return {};
	}
};
