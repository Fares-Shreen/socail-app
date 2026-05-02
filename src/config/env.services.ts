import path from "path";
import { config } from "dotenv";
const envStatus = process.env.NODE_ENV
config({ path: path.resolve(__dirname, `../../.env.${envStatus}`) })

export const PORT = process.env.PORT
export const DBURL = process.env.DBURL
export const SALT_ROUNDS = process.env.SALT_ROUNDS;
export const IV_LENGTH = process.env.IV_LENGTH;
export const JWT_SECRET = process.env.JWT_SECRET;
export const ACCESS_TOKEN_ACCESS_USER = process.env.ACCESS_TOKEN_ACCESS_USER;
export const REFRESH_TOKEN_ACCESS_USER = process.env.REFRESH_TOKEN_ACCESS_USER;
export const ACCESS_TOKEN_ACCESS_ADMIN = process.env.ACCESS_TOKEN_ACCESS_ADMIN;
export const REFRESH_TOKEN_ACCESS_ADMIN = process.env.REFRESH_TOKEN_ACCESS_ADMIN;
export const SEND_EMAIL_EVENT  = process.env.SEND_EMAIL_EVENT;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
export const EMAIL = process.env.EMAIL
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD
export const REDIS_URL = process.env.REDIS_URL
export const USER = process.env.USER
export const ADMIN = process.env.ADMIN
export const AWS_REGION = process.env.AWS_REGION!
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!
export const AWS_ACCESS_KEY =  process.env.AWS_ACCESS_KEY!
export const AWS_SECRET_ACCESS_KEY =  process.env.AWS_SECRET_ACCESS_KEY!