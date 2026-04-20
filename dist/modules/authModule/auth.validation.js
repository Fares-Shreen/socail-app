"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.logoutSchema = exports.resetPasswordSchema = exports.forgetPasswordSchema = exports.updatePasswordSchema = exports.signUpWithGoogleSchema = exports.signInSchema = exports.confirmOtpSchema = exports.resendOtpSchema = exports.signUpSchema = void 0;
const z = __importStar(require("zod"));
const enum_1 = require("../../common/enum/enum");
exports.signUpSchema = {
    body: z.object({
        firstName: z.string().min(3).max(25),
        lastName: z.string().min(3).max(25),
        email: z.string().email(),
        phone: z.string().min(11).max(11),
        password: z.string(),
        confirmPassword: z.string(),
        address: z.string().optional(),
        age: z.number().min(18).max(60),
        gender: z.enum(enum_1.genderEnum).optional(),
        role: z.enum(enum_1.roleEnum).optional(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirm"],
    }),
};
exports.resendOtpSchema = {
    body: z.object({
        email: z.string().email(),
    }),
};
exports.confirmOtpSchema = {
    body: z.object({
        email: z.string().email(),
        otp: z.string().min(6).max(6),
    }),
};
exports.signInSchema = {
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
};
exports.signUpWithGoogleSchema = {
    body: z.object({
        idToken: z.string(),
    }),
};
exports.updatePasswordSchema = {
    body: z.object({
        oldPassword: z.string(),
        newPassword: z.string(),
    }),
};
exports.forgetPasswordSchema = {
    body: z.object({
        email: z.string().email(),
    }),
};
exports.resetPasswordSchema = {
    body: z.object({
        email: z.string().email(),
        otp: z.string().min(6).max(6),
        newPassword: z.string(),
    }),
};
exports.logoutSchema = {
    query: z.object({
        flag: z.string().optional(),
    }),
};
exports.refreshTokenSchema = {
    body: z.object({
        refreshToken: z.string(),
    }),
};
