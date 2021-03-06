import * as _env from 'dotenv';

_env.config();

export const DEV_BASE_URL = `http://localhost:${process.env.CLIENT_PORT}`;

export const REDIS_ACCESS_TOKEN_PREFIX = 'access-token: ';
export const REDIS_REFRESH_TOKEN_PREFIX = 'refresh-token: ';
export const USER_TOKEN_ID_PREFIX = 'userTokenId:';
export const EMAIL_CONFIRM_PREFIX = 'emailConfirm:';
export const FORGOT_PASSWORD_PREFIX = 'forgotPassword:';
