import crypto from "node:crypto";
import { IV_LENGTH } from "../../../config/env.services";


const ENCRYPTION_KEY = Buffer.from("12345678901234567890123456789012");

const _IVLength = Number(IV_LENGTH || 16);

export function encrypt(text: string) {
    const iv = crypto.randomBytes(_IVLength);

    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, "utf8", "hex");

    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text: string) {
    const [ivHex, encryptedText] = text.split(":");

    if (!ivHex || !encryptedText) {
        throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(ivHex as string, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");

    decrypted += decipher.final("utf8");

    return decrypted;
}
