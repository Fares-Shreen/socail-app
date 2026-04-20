import * as z from "zod";
import { genderEnum, roleEnum } from "../../common/enum/enum";
import e from "express";


export const signUpSchema = {
    body: z.object({
        firstName: z.string().min(3).max(25),
        lastName: z.string().min(3).max(25),
        email: z.string().email(),
        phone: z.string().min(11).max(11),
        password: z.string(),
        confirmPassword: z.string(),
        address: z.string().optional(),
        age: z.number().min(18).max(60),
        gender: z.enum(genderEnum).optional(),
        role: z.enum(roleEnum).optional(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirm"],
    }),
}

export const resendOtpSchema = {
    body: z.object({
        email: z.string().email(),
    }),
}

export const confirmOtpSchema = {
    body: z.object({
        email: z.string().email(),
        otp: z.string().min(6).max(6),
    }),
}

export const signInSchema = {
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
}

export const signUpWithGoogleSchema = {
    body: z.object({
        idToken: z.string(),
    }),
}

export const updatePasswordSchema = {
    body: z.object({
        oldPassword: z.string(),
        newPassword: z.string(),
    }),
}

export const forgetPasswordSchema = {
    body: z.object({
        email: z.string().email(),
    }),
}

export const resetPasswordSchema = {
    body: z.object({
        email: z.string().email(),
        otp: z.string().min(6).max(6),
        newPassword: z.string(),
    }),
}

export const logoutSchema = {
    query: z.object({
        flag: z.string().optional(),
    }),
}

export const refreshTokenSchema = {
    body: z.object({
        refreshToken: z.string(),
    }),
}
