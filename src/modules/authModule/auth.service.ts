import { NextFunction, Request, Response } from "express";
import userModel, { IUser } from "../../DB/models/userModel";
import { genderEnum, providerEnum, roleEnum } from "../../common/enum/enum";
import userRepositories from "../../DB/repositories/user.repositories";
import { HydratedDocument } from "mongoose";
import { appError } from "../../common/utils/global.error.handler";
import { encrypt } from "../../common/utils/security/encryption";
import { compare, hash } from "../../common/utils/security/hash.security";
import { emailEventtEmitter } from "../../common/utils/nodemailer/email.event";
import { ACCESS_TOKEN_ACCESS_ADMIN, ACCESS_TOKEN_ACCESS_USER, GOOGLE_CLIENT_ID, REFRESH_TOKEN_ACCESS_ADMIN, REFRESH_TOKEN_ACCESS_USER, SEND_EMAIL_EVENT } from "../../config/env.services";
import { generateOTP, sendEmail } from "../../common/utils/nodemailer/sendEmail";
import emailTemplate from "../../common/utils/nodemailer/emailTemplete";
import jwt, { JwtPayload } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import redisService from "../../cache/redis.service";


class AuthServices {

    private readonly _userModel = userRepositories;
    private readonly _redisService = redisService;
    constructor() { }
    sendEmailOTP = async ({ email, subject }: { email: string, subject: string }) => {
        const bloackedOtp = await this._redisService.ttl(this._redisService.block_otp_key({ email, subject }));
        if (bloackedOtp) {
            if (bloackedOtp > 0) {
                throw new Error(
                    `you reached the limit of sending otp, you can resend after ${bloackedOtp} seconds`,
                    { cause: 400 },
                );
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
            throw new Error(
                `you reached the limit of sending otp, you can resend after ${bloackedOtp} seconds`,
                {
                    cause: 400,
                },
            );
        }

        const otp = generateOTP();
        emailEventtEmitter.emit(SEND_EMAIL_EVENT as string, async () => {
            await sendEmail({
                to: email,
                subject: "OTP",
                html: emailTemplate(email, otp.toString()),
            });
        });
        const otpHashed = hash({ plainText: otp.toString(), saltRounds: 12 });
        await this._redisService.setRedis({
            key: this._redisService.otpKey({ email, subject }),
            value: otpHashed,
            ttl: 60 * 2,
        });
        await this._redisService.increment(this._redisService.max_otp_key({ email, subject }));
    };

    signUp = async (req: Request, res: Response, next: NextFunction) => {
        const { firstName, lastName, email, password, phone, address, age, gender, role, userName } = req.body;
        const userExist: HydratedDocument<IUser> | null = await this._userModel.findOne({ filter: { email } })

        if (userExist) {
            throw new appError("User already exist", 409)
        }

        const user: HydratedDocument<IUser> = await this._userModel.create({
            firstName,
            lastName,
            email,
            password: hash({ plainText: password }),
            phone: encrypt(phone),
            address,
            provider: providerEnum.system,
            age,
            gender,
            role
        } as Partial<IUser>);

        const OTP = generateOTP();

        emailEventtEmitter.emit(SEND_EMAIL_EVENT as string, async () => {
            sendEmail({
                to: user.email,
                subject: "Welcome to Social App",
                html: emailTemplate(user.userName, OTP.toString())
            })
        })

        const hashedOTP = hash({ plainText: OTP.toString() });
        await this._redisService.setRedis({ key: this._redisService.otpKey({ email: user.email, subject: "signup" }), value: hashedOTP, ttl: 60 * 2 })
        await this._redisService.setRedis({ key: this._redisService.max_otp_key({ email: user.email, subject: "signup" }), value: 1, ttl: 60 * 2 })

        res.status(201).json({ message: "OTP sent successfully", data: user })
    }

    resendOtpSignUp = async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body
        const userExist: HydratedDocument<IUser> | null = await this._userModel.findOne({ filter: { email } })

        if (!userExist) {
            throw new appError("User not exist", 409)
        }

        await this.sendEmailOTP({ email, subject: "signup" })
        res.status(200).json({ message: "success resend otp" })
    }

    confirmSignUp = async (req: Request, res: Response, next: NextFunction) => {
        const { email, otp } = req.body
        const userExist: HydratedDocument<IUser> | null = await this._userModel.findOne({ filter: { email } })

        if (!userExist) {
            throw new appError("User not exist", 409)
        }
        const cashedOtp = await this._redisService.getRedis(this._redisService.otpKey({ email, subject: "signup" }))
        if (!cashedOtp) {
            throw new appError("Invalid otp", 409)
        }
        const otpMatch = compare({ plainText: otp, cipherText: cashedOtp });
        if (!otpMatch) {
            throw new appError("Invalid otp", 409)
        }
        const confirmAccount: HydratedDocument<IUser> | null = await this._userModel.findOneAndUpdate({ filter: { email, confirmed: { $ne: true } }, update: { confirmed: true } })
        if (!confirmAccount) {
            throw new appError("Error in confirm account", 409)
        }
        await this._redisService.deleteRedis(this._redisService.otpKey({ email, subject: "signup" }))
        await this._redisService.deleteRedis(this._redisService.max_otp_key({ email, subject: "signup" }))

        res.status(200).json({ message: "success confirm signup" })
    }

    signIn = async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body;
        const userExist: HydratedDocument<IUser> | null = await this._userModel.findOne({ filter: { email } })

        if (!userExist) {
            throw new appError("User not exist", 409)
        }
        if (!userExist.confirmed) {
            throw new appError("User not confirmed", 409)
        }
        const passwordMatch: boolean = compare({ plainText: password, cipherText: userExist.password });

        if (!passwordMatch) {
            throw new appError("Invalid password", 409)
        }

        const OTP = generateOTP();

        emailEventtEmitter.emit(SEND_EMAIL_EVENT as string, async () => {
            sendEmail({
                to: userExist.email,
                subject: "Welcome to Social App",
                html: emailTemplate(userExist.userName, OTP.toString())
            })
        })
        const hashedOTP = hash({ plainText: OTP.toString() });
        await this._redisService.setRedis({ key: this._redisService.otpKey({ email: userExist.email, subject: "signin" }), value: hashedOTP, ttl: 60 * 2 })
        await this._redisService.setRedis({ key: this._redisService.max_otp_key({ email: userExist.email, subject: "signin" }), value: 1, ttl: 60 * 2 })
        res.status(200).json({ message: "OTP sent successfully" })
    }

    resendOtpSignIn = async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body
        const userExist: HydratedDocument<IUser> | null = await this._userModel.findOne({ filter: { email } })

        if (!userExist) {
            throw new appError("User not exist", 409)
        }

        await this.sendEmailOTP({ email, subject: "signin" })
        res.status(200).json({ message: "success resend otp" })
    }

    confirmSignIn = async (req: Request, res: Response, next: NextFunction) => {
        const { email, otp } = req.body
        const userExist: HydratedDocument<IUser> | null = await this._userModel.findOne({ filter: { email } })
        if (!userExist) {
            throw new appError("User not exist", 409)
        }
        const cashedOtp = await this._redisService.getRedis(this._redisService.otpKey({ email, subject: "signin" }))
        if (!cashedOtp) {
            throw new appError("Invalid otp", 409)
        }
        const otpMatch = compare({ plainText: otp, cipherText: cashedOtp });
        if (!otpMatch) {
            throw new appError("Invalid otp", 409)
        }

        const accessTokenId = randomUUID();
        const refreshTokenId = randomUUID();
        const accessToken = jwt.sign({ id: userExist._id, email: userExist.email }, userExist.role === roleEnum.admin
            ? ACCESS_TOKEN_ACCESS_ADMIN!
            : ACCESS_TOKEN_ACCESS_USER! as string, { expiresIn: "1d", jwtid: accessTokenId });
        const refreshToken = jwt.sign({ id: userExist._id, email: userExist.email },
            userExist.role === roleEnum.admin ? REFRESH_TOKEN_ACCESS_ADMIN! : REFRESH_TOKEN_ACCESS_USER! as string, { expiresIn: "7d", jwtid: refreshTokenId });

        await this._redisService.deleteRedis(this._redisService.otpKey({ email, subject: "signin" }))
        await this._redisService.deleteRedis(this._redisService.max_otp_key({ email, subject: "signin" }))
        await this._redisService.deleteRedis(this._redisService.revokedKey({ userId: userExist.id as string, jti: accessTokenId }));


        res.status(200).json({ message: "success confirm signin", data: { accessToken, refreshToken } })
    }

    signUpWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
        const { idToken } = req.body;
        console.log(idToken);


        const client = new OAuth2Client(GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID as string,
        });
        console.log(ticket);


        const payload = ticket.getPayload();
        if (!payload) throw new Error("Invalid Google token");

        const { given_name, family_name, email, picture } = payload;

        let user: HydratedDocument<IUser> | null =
            await this._userModel.findOne({ filter: { email: email as string } });

        if (!user) {
            user = await this._userModel.create({
                firstName: given_name || "User",
                lastName: family_name || "Google",
                email,
                password: hash({ plainText: randomUUID() }),
                provider: providerEnum.google,
                role: roleEnum.user,
                confirmed: true,
            } as Partial<IUser>);
            console.log(user);
        }

        if (user.provider === providerEnum.system) {
            return res.status(400).json({
                message: "Please login using email & password",
            });
        }

        const accessToken = jwt.sign(
            { id: user._id, email: user.email },
            user.role === roleEnum.admin
                ? ACCESS_TOKEN_ACCESS_ADMIN!
                : ACCESS_TOKEN_ACCESS_USER! as string,
            { expiresIn: "1d", jwtid: randomUUID() }
        );

        const refreshToken = jwt.sign(
            { id: user._id, email: user.email },
            user.role === roleEnum.admin ? REFRESH_TOKEN_ACCESS_ADMIN! : REFRESH_TOKEN_ACCESS_USER! as string,
            { expiresIn: "7d", jwtid: randomUUID() }
        );

        return res.status(200).json({
            message: "Success",
            data: { accessToken, refreshToken },
        });
    }

    refreshToke = async(req: Request, res: Response, next: NextFunction) => {
        const { refreshToken } = req.body;
        console.log(refreshToken);
        
        const refreshTokenType = refreshToken.split(" ")[0];
        const refreshTokenValue = refreshToken.split(" ")[1];
        console.log(refreshTokenType);
        

        if (!refreshTokenType || !refreshTokenValue) {
            throw new appError("token not found", 404)
        }
        const decoded = jwt.verify(refreshTokenValue, refreshTokenType === roleEnum.admin ? REFRESH_TOKEN_ACCESS_ADMIN! : REFRESH_TOKEN_ACCESS_USER! as string) as JwtPayload;
        if (!decoded) {
            throw new appError("Invalid refresh token", 409);
        }
        console.log(decoded);
        
        const user = await this._userModel.findById(decoded.id);
        console.log(user);
        
        if (!user) {
            throw new appError("User not found", 404);
        }

        const accessToken = jwt.sign({ id: user._id, email: user.email }, user.role === roleEnum.admin
            ? ACCESS_TOKEN_ACCESS_ADMIN!
            : ACCESS_TOKEN_ACCESS_USER! as string, { expiresIn: "1d", jwtid: randomUUID() });
        res.status(200).json({ message: "success refresh token", data: { accessToken } })
    }

    updatePaswword = async (req: Request, res: Response, next: NextFunction) => {
        const { oldPassword, newPassword } = req.body;
        const user = req.user;
        if (!user) {
            throw new appError("User not found", 404);
        }
        const passwordMatch = compare({ plainText: oldPassword, cipherText: user.password });
        if (!passwordMatch) {
            throw new appError("Invalid old password", 409);
        }
        await this._userModel.findOneAndUpdate({
            filter: { _id: user._id },
            update: {
                password: hash({ plainText: newPassword }),
                changeCredentials: new Date()
            },
            options: { new: true }
        });
        res.status(200).json({ message: "success update password" })
    }

    forgetPssword = async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({ filter: { email } })
        if (!user) {
            throw new appError("User not found", 404);
        }
        const OTP = generateOTP();
        emailEventtEmitter.emit(SEND_EMAIL_EVENT as string, async () => {
            sendEmail({
                to: user.email,
                subject: "Forget Password",
                html: emailTemplate(user.userName, OTP.toString())
            })
        })
        const hashedOTP = hash({ plainText: OTP.toString() });
        await this._redisService.setRedis({
            key: this._redisService.otpKey({ email, subject: "forget" }),
            value: hashedOTP,
            ttl: 60 * 2
        });
        await this._redisService.setRedis(
            {
                key: this._redisService.max_otp_key({ email, subject: "forget" }),
                value: hashedOTP,
                ttl: 60 * 2
            }
        );
        res.status(200).json({ message: "success forget password" })
    }

    resendForgetPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({ filter: { email } })
        if (!user) {
            throw new appError("User not found", 404);
        }
        this.sendEmailOTP({ email, subject: "forget" });
        res.status(200).json({ message: "success resend forget password otp" })
    }

    confirmForegtPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
        const { email, newPassword } = req.body;
        const user = await this._userModel.findOne({ filter: { email } })
        if (!user) {
            throw new appError("User not found", 404);
        }
        await this._userModel.findOneAndUpdate({
            filter: { email },
            update: {
                password: hash({ plainText: newPassword }),
                changeCredentials: new Date()
            }
        });
        await this._redisService.deleteRedis(this._redisService.otpKey({ email, subject: "forget" }));
        await this._redisService.deleteRedis(this._redisService.max_otp_key({ email, subject: "forget" }));
        res.status(200).json({ message: "Your password has been successfully updated" })
    }

    logout = async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        const decoded = req.decoded;
        const flag = req.query.flag;
        if (!user || !decoded) {
            throw new appError("User not found", 404);
        }
        if (flag === "all") {
            user.changeCredentials = new Date();
            await user.save();
            const allRevokedKeys = this._redisService.getAllRevokedKeys({ userId: user.id as string });
            await this._redisService.deleteRedis(allRevokedKeys);
        }
        await this._redisService.setRedis({
            key: this._redisService.revokedKey({ userId: user.id as string, jti: decoded.jti as string }),
            value: decoded.jti as string,
            ttl: decoded.exp! - Math.floor(Date.now() / 1000),
        })
        res.status(200).json({ message: "success logout" })
    }
}

export default new AuthServices()