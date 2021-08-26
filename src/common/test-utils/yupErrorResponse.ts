export const yupErrorResponse = (data) => {
	try {
		return JSON.parse(data.response.errors[0].message);
	} catch (error) {
		return data.response.errors[0].message;
	}
};
