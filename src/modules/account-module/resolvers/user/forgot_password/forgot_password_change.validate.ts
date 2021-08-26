import * as yup from "yup";
import { sharedSchema } from "../../../../../common/shared/yupSchema";

export const YUP_CHANGE_PASSWORD = yup.object().shape({
	key: yup.string(),
	newPassword: sharedSchema.password,
});
