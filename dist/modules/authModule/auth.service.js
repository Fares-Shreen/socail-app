"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enum_1 = require("../../common/enum/enum");
const user_repositories_1 = __importDefault(require("../../DB/repositories/user.repositories"));
const global_error_handler_1 = require("../../common/utils/global.error.handler");
const encryption_1 = require("../../common/utils/security/encryption");
const hash_security_1 = require("../../common/utils/security/hash.security");
const email_event_1 = require("../../common/utils/nodemailer/email.event");
const env_services_1 = require("../../config/env.services");
const sendEmail_1 = require("../../common/utils/nodemailer/sendEmail");
const emailTemplete_1 = __importDefault(require("../../common/utils/nodemailer/emailTemplete"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = require("node:crypto");
const google_auth_library_1 = require("google-auth-library");
const redis_service_1 = __importDefault(require("../../cache/redis.service"));
class AuthServices {
    _userModel = user_repositories_1.default;
    _redisService = redis_service_1.default;
    constructor() { }
    sendEmailOTP = async ({ email, subject }) => {
        const bloackedOtp = await this._redisService.ttl(this._redisService.block_otp_key({ email, subject }));
        if (bloackedOtp) {
            if (bloackedOtp > 0) {
                throw new Error(`you reached the limit of sending otp, you can resend after ${bloackedOtp} seconds`, { cause: 400 });
            }
        }
        const otpTtl = await this._redisService.ttl(this._redisService.otpKey({ email, subject }));
        if (otpTtl) {
            if (otpTtl > 0) {
                throw new Error(`you can resend otp after ${otpTtl} seconds`, {
                    cause: 400,
                });
            }
        }
        const maxOtpsend = await this._redisService.getRedis(this._redisService.max_otp_key({ email, subject }));
        if (maxOtpsend >= 2) {
            await this._redisService.setRedis({
                key: this._redisService.block_otp_key({ email, subject }),
                value: 1,
                ttl: 60,
            });
            await this._redisService.deleteRedis(this._redisService.max_otp_key({ email, subject }));
            throw new Error(`you reached the limit of sending otp, you can resend after ${bloackedOtp} seconds`, {
                cause: 400,
            });
        }
        const otp = (0, sendEmail_1.generateOTP)();
        email_event_1.emailEventtEmitter.emit(env_services_1.SEND_EMAIL_EVENT, async () => {
            await (0, sendEmail_1.sendEmail)({
                to: email,
                subject: "OTP",
                html: (0, emailTemplete_1.default)(email, otp.toString()),
            });
        });
        const otpHashed = (0, hash_security_1.hash)({ plainText: otp.toString(), saltRounds: 12 });
        await this._redisService.setRedis({
            key: this._redisService.otpKey({ email, subject }),
            value: otpHashed,
            ttl: 60 * 2,
        });
        await this._redisService.increment(this._redisService.max_otp_key({ email, subject }));
    };
    signUp = async (req, res, next) => {
        const { firstName, lastName, email, password, phone, address, age, gender, role, userName } = req.body;
        const userExist = await this._userModel.findOne({ filter: { email } });
        if (userExist) {
            throw new global_error_handler_1.appError("User already exist", 409);
        }
        const user = await this._userModel.create({
            firstName,
            lastName,
            email,
            password: (0, hash_security_1.hash)({ plainText: password }),
            phone: (0, encryption_1.encrypt)(phone),
            address,
            provider: enum_1.providerEnum.system,
            age,
            gender,
            role
        });
        const OTP = (0, sendEmail_1.generateOTP)();
        email_event_1.emailEventtEmitter.emit(env_services_1.SEND_EMAIL_EVENT, async () => {
            (0, sendEmail_1.sendEmail)({
                to: user.email,
                subject: "Welcome to Social App",
                html: (0, emailTemplete_1.default)(user.userName, OTP.toString())
            });
        });
        const hashedOTP = (0, hash_security_1.hash)({ plainText: OTP.toString() });
        await this._redisService.setRedis({ key: this._redisService.otpKey({ email: user.email, subject: "signup" }), value: hashedOTP, ttl: 60 * 2 });
        await this._redisService.setRedis({ key: this._redisService.max_otp_key({ email: user.email, subject: "signup" }), value: 1, ttl: 60 * 2 });
        res.status(201).json({ message: "OTP sent successfully", data: user });
    };
    resendOtpSignUp = async (req, res, next) => {
        const { email } = req.body;
        const userExist = await this._userModel.findOne({ filter: { email } });
        if (!userExist) {
            throw new global_error_handler_1.appError("User not exist", 409);
        }
        await this.sendEmailOTP({ email, subject: "signup" });
        res.status(200).json({ message: "success resend otp" });
    };
    confirmSignUp = async (req, res, next) => {
        const { email, otp } = req.body;
        const userExist = await this._userModel.findOne({ filter: { email } });
        if (!userExist) {
            throw new global_error_handler_1.appError("User not exist", 409);
        }
        const cashedOtp = await this._redisService.getRedis(this._redisService.otpKey({ email, subject: "signup" }));
        if (!cashedOtp) {
            throw new global_error_handler_1.appError("Invalid otp", 409);
        }
        const otpMatch = (0, hash_security_1.compare)({ plainText: otp, cipherText: cashedOtp });
        if (!otpMatch) {
            throw new global_error_handler_1.appError("Invalid otp", 409);
        }
        const confirmAccount = await this._userModel.findOneAndUpdate({ filter: { email, confirmed: { $ne: true } }, update: { confirmed: true } });
        if (!confirmAccount) {
            throw new global_error_handler_1.appError("Error in confirm account", 409);
        }
        await this._redisService.deleteRedis(this._redisService.otpKey({ email, subject: "signup" }));
        await this._redisService.deleteRedis(this._redisService.max_otp_key({ email, subject: "signup" }));
        res.status(200).json({ message: "success confirm signup" });
    };
    signIn = async (req, res, next) => {
        const { email, password } = req.body;
        const userExist = await this._userModel.findOne({ filter: { email } });
        if (!userExist) {
            throw new global_error_handler_1.appError("User not exist", 409);
        }
        if (!userExist.confirmed) {
            throw new global_error_handler_1.appError("User not confirmed", 409);
        }
        const passwordMatch = (0, hash_security_1.compare)({ plainText: password, cipherText: userExist.password });
        if (!passwordMatch) {
            throw new global_error_handler_1.appError("Invalid password", 409);
        }
        const OTP = (0, sendEmail_1.generateOTP)();
        email_event_1.emailEventtEmitter.emit(env_services_1.SEND_EMAIL_EVENT, async () => {
            (0, sendEmail_1.sendEmail)({
                to: userExist.email,
                subject: "Welcome to Social App",
                html: (0, emailTemplete_1.default)(userExist.userName, OTP.toString())
            });
        });
        const hashedOTP = (0, hash_security_1.hash)({ plainText: OTP.toString() });
        await this._redisService.setRedis({ key: this._redisService.otpKey({ email: userExist.email, subject: "signin" }), value: hashedOTP, ttl: 60 * 2 });
        await this._redisService.setRedis({ key: this._redisService.max_otp_key({ email: userExist.email, subject: "signin" }), value: 1, ttl: 60 * 2 });
        res.status(200).json({ message: "OTP sent successfully" });
    };
    resendOtpSignIn = async (req, res, next) => {
        const { email } = req.body;
        const userExist = await this._userModel.findOne({ filter: { email } });
        if (!userExist) {
            throw new global_error_handler_1.appError("User not exist", 409);
        }
        await this.sendEmailOTP({ email, subject: "signin" });
        res.status(200).json({ message: "success resend otp" });
    };
    confirmSignIn = async (req, res, next) => {
        const { email, otp } = req.body;
        const userExist = await this._userModel.findOne({ filter: { email } });
        if (!userExist) {
            throw new global_error_handler_1.appError("User not exist", 409);
        }
        const cashedOtp = await this._redisService.getRedis(this._redisService.otpKey({ email, subject: "signin" }));
        if (!cashedOtp) {
            throw new global_error_handler_1.appError("Invalid otp", 409);
        }
        const otpMatch = (0, hash_security_1.compare)({ plainText: otp, cipherText: cashedOtp });
        if (!otpMatch) {
            throw new global_error_handler_1.appError("Invalid otp", 409);
        }
        const accessTokenId = (0, node_crypto_1.randomUUID)();
        const refreshTokenId = (0, node_crypto_1.randomUUID)();
        const accessToken = jsonwebtoken_1.default.sign({ id: userExist._id, email: userExist.email }, userExist.role === enum_1.roleEnum.admin
            ? env_services_1.ACCESS_TOKEN_ACCESS_ADMIN
            : env_services_1.ACCESS_TOKEN_ACCESS_USER, { expiresIn: "1d", jwtid: accessTokenId });
        const refreshToken = jsonwebtoken_1.default.sign({ id: userExist._id, email: userExist.email }, userExist.role === enum_1.roleEnum.admin ? env_services_1.REFRESH_TOKEN_ACCESS_ADMIN : env_services_1.REFRESH_TOKEN_ACCESS_USER, { expiresIn: "7d", jwtid: refreshTokenId });
        await this._redisService.deleteRedis(this._redisService.otpKey({ email, subject: "signin" }));
        await this._redisService.deleteRedis(this._redisService.max_otp_key({ email, subject: "signin" }));
        await this._redisService.deleteRedis(this._redisService.revokedKey({ userId: userExist.id, jti: accessTokenId }));
        res.status(200).json({ message: "success confirm signin", data: { accessToken, refreshToken } });
    };
    signUpWithGoogle = async (req, res, next) => {
        const { idToken } = req.body;
        console.log(idToken);
        const client = new google_auth_library_1.OAuth2Client(env_services_1.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken,
            audience: env_services_1.GOOGLE_CLIENT_ID,
        });
        console.log(ticket);
        const payload = ticket.getPayload();
        if (!payload)
            throw new Error("Invalid Google token");
        const { given_name, family_name, email, picture } = payload;
        let user = await this._userModel.findOne({ filter: { email: email } });
        if (!user) {
            user = await this._userModel.create({
                firstName: given_name || "User",
                lastName: family_name || "Google",
                email,
                password: (0, hash_security_1.hash)({ plainText: (0, node_crypto_1.randomUUID)() }),
                provider: enum_1.providerEnum.google,
                role: enum_1.roleEnum.user,
                confirmed: true,
            });
            console.log(user);
        }
        if (user.provider === enum_1.providerEnum.system) {
            return res.status(400).json({
                message: "Please login using email & password",
            });
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, user.role === enum_1.roleEnum.admin
            ? env_services_1.ACCESS_TOKEN_ACCESS_ADMIN
            : env_services_1.ACCESS_TOKEN_ACCESS_USER, { expiresIn: "1d", jwtid: (0, node_crypto_1.randomUUID)() });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, user.role === enum_1.roleEnum.admin ? env_services_1.REFRESH_TOKEN_ACCESS_ADMIN : env_services_1.REFRESH_TOKEN_ACCESS_USER, { expiresIn: "7d", jwtid: (0, node_crypto_1.randomUUID)() });
        return res.status(200).json({
            message: "Success",
            data: { accessToken, refreshToken },
        });
    };
    refreshToke = async (req, res, next) => {
        const { refreshToken } = req.body;
        console.log(refreshToken);
        const refreshTokenType = refreshToken.split(" ")[0];
        const refreshTokenValue = refreshToken.split(" ")[1];
        console.log(refreshTokenType);
        if (!refreshTokenType || !refreshTokenValue) {
            throw new global_error_handler_1.appError("token not found", 404);
        }
        const decoded = jsonwebtoken_1.default.verify(refreshTokenValue, refreshTokenType === enum_1.roleEnum.admin ? env_services_1.REFRESH_TOKEN_ACCESS_ADMIN : env_services_1.REFRESH_TOKEN_ACCESS_USER);
        if (!decoded) {
            throw new global_error_handler_1.appError("Invalid refresh token", 409);
        }
        console.log(decoded);
        const user = await this._userModel.findById(decoded.id);
        console.log(user);
        if (!user) {
            throw new global_error_handler_1.appError("User not found", 404);
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, user.role === enum_1.roleEnum.admin
            ? env_services_1.ACCESS_TOKEN_ACCESS_ADMIN
            : env_services_1.ACCESS_TOKEN_ACCESS_USER, { expiresIn: "1d", jwtid: (0, node_crypto_1.randomUUID)() });
        res.status(200).json({ message: "success refresh token", data: { accessToken } });
    };
    updatePaswword = async (req, res, next) => {
        const { oldPassword, newPassword } = req.body;
        const user = req.user;
        if (!user) {
            throw new global_error_handler_1.appError("User not found", 404);
        }
        const passwordMatch = (0, hash_security_1.compare)({ plainText: oldPassword, cipherText: user.password });
        if (!passwordMatch) {
            throw new global_error_handler_1.appError("Invalid old password", 409);
        }
        await this._userModel.findOneAndUpdate({
            filter: { _id: user._id },
            update: {
                password: (0, hash_security_1.hash)({ plainText: newPassword }),
                changeCredentials: new Date()
            },
            options: { new: true }
        });
        res.status(200).json({ message: "success update password" });
    };
    forgetPssword = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            throw new global_error_handler_1.appError("User not found", 404);
        }
        const OTP = (0, sendEmail_1.generateOTP)();
        email_event_1.emailEventtEmitter.emit(env_services_1.SEND_EMAIL_EVENT, async () => {
            (0, sendEmail_1.sendEmail)({
                to: user.email,
                subject: "Forget Password",
                html: (0, emailTemplete_1.default)(user.userName, OTP.toString())
            });
        });
        const hashedOTP = (0, hash_security_1.hash)({ plainText: OTP.toString() });
        await this._redisService.setRedis({
            key: this._redisService.otpKey({ email, subject: "forget" }),
            value: hashedOTP,
            ttl: 60 * 2
        });
        await this._redisService.setRedis({
            key: this._redisService.max_otp_key({ email, subject: "forget" }),
            value: hashedOTP,
            ttl: 60 * 2
        });
        res.status(200).json({ message: "success forget password" });
    };
    resendForgetPasswordOtp = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            throw new global_error_handler_1.appError("User not found", 404);
        }
        this.sendEmailOTP({ email, subject: "forget" });
        res.status(200).json({ message: "success resend forget password otp" });
    };
    confirmForegtPasswordOtp = async (req, res, next) => {
        const { email, newPassword } = req.body;
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            throw new global_error_handler_1.appError("User not found", 404);
        }
        await this._userModel.findOneAndUpdate({
            filter: { email },
            update: {
                password: (0, hash_security_1.hash)({ plainText: newPassword }),
                changeCredentials: new Date()
            }
        });
        await this._redisService.deleteRedis(this._redisService.otpKey({ email, subject: "forget" }));
        await this._redisService.deleteRedis(this._redisService.max_otp_key({ email, subject: "forget" }));
        res.status(200).json({ message: "Your password has been successfully updated" });
    };
    logout = async (req, res, next) => {
        const user = req.user;
        const decoded = req.decoded;
        const flag = req.query.flag;
        if (!user || !decoded) {
            throw new global_error_handler_1.appError("User not found", 404);
        }
        if (flag === "all") {
            user.changeCredentials = new Date();
            await user.save();
            const allRevokedKeys = this._redisService.getAllRevokedKeys({ userId: user.id });
            await this._redisService.deleteRedis(allRevokedKeys);
        }
        await this._redisService.setRedis({
            key: this._redisService.revokedKey({ userId: user.id, jti: decoded.jti }),
            value: decoded.jti,
            ttl: decoded.exp - Math.floor(Date.now() / 1000),
        });
        res.status(200).json({ message: "success logout" });
    };
}
exports.default = new AuthServices();
