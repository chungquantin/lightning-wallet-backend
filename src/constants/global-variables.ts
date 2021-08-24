import * as _env from "dotenv";

_env.config();

export const DEV_BASE_URL = `http://localhost:${process.env.CLIENT_PORT}`;

export const REDIS_TOKEN_PREFIX = "token: ";
export const USER_TOKEN_ID_PREFIX = "userTokenId:";
export const EMAIL_CONFIRM_PREFIX = "emailConfirm:";
export const FORGOT_PASSWORD_PREFIX = "forgotPassword:";
