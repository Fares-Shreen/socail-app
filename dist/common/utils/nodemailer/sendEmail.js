"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_services_1 = require("../../../config/env.services");
const transport = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: env_services_1.EMAIL,
        pass: env_services_1.EMAIL_PASSWORD,
    },
});
const sendEmail = async ({ to, subject, attachements, html }) => {
    const info = await transport.sendMail({
        from: `"Social App" <${process.env.EMAIL}>`,
        to: to,
        subject,
        html,
    });
    console.log("Message sent: %s", info);
    return info.accepted.length > 0 ? true : false;
};
exports.sendEmail = sendEmail;
const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
};
exports.generateOTP = generateOTP;
