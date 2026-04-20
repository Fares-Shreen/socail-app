import nodemailer from "nodemailer";
import { EMAIL, EMAIL_PASSWORD } from "../../../config/env.services";

const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL,
        pass: EMAIL_PASSWORD,
    },
}); 


export const sendEmail = async ({ to, subject, attachements ,html }: { to: string, subject: string, attachements?: any ,html: string })=>{
    
    const info = await transport.sendMail({
        from: `"Social App" <${process.env.EMAIL}>`,
        to: to,
        subject,
        html,
    });
    console.log("Message sent: %s", info);
    
    return info.accepted.length > 0? true : false;
}



export  const generateOTP = () => {
    const otp: number = Math.floor(100000 + Math.random() * 900000);
    return otp;
}