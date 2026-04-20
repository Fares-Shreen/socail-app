"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const node_crypto_1 = __importDefault(require("node:crypto"));
const env_services_1 = require("../../../config/env.services");
const ENCRYPTION_KEY = Buffer.from("12345678901234567890123456789012");
const _IVLength = Number(env_services_1.IV_LENGTH || 16);
function encrypt(text) {
    const iv = node_crypto_1.default.randomBytes(_IVLength);
    const cipher = node_crypto_1.default.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
}
function decrypt(text) {
    const [ivHex, encryptedText] = text.split(":");
    if (!ivHex || !encryptedText) {
        throw new Error("Invalid encrypted text format");
    }
    const iv = Buffer.from(ivHex, "hex");
    const decipher = node_crypto_1.default.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
