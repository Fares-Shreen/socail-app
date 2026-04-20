"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.increment = exports.ttl = exports.deleteRedis = exports.getRedis = exports.update = exports.setRedis = exports.OTAL = exports.max_otp_key = exports.block_otp_key = exports.otpKey = exports.getAllRevokedKeys = exports.revokedKey = void 0;
const redisConnection_1 = require("./redisConnection");
const revokedKey = ({ userId, jti }) => {
    return `revokeToken::${userId}::${jti}`;
};
exports.revokedKey = revokedKey;
const getAllRevokedKeys = ({ userId }) => {
    return `revokeToken::${userId}::*`;
};
exports.getAllRevokedKeys = getAllRevokedKeys;
const otpKey = ({ email, subject }) => {
    return `otp::${email}::${subject}`;
};
exports.otpKey = otpKey;
const block_otp_key = ({ email, subject }) => {
    return `block_otp::${email}::${subject}`;
};
exports.block_otp_key = block_otp_key;
const max_otp_key = ({ email, subject }) => {
    return `max_otp::${email}::${subject}`;
};
exports.max_otp_key = max_otp_key;
const OTAL = ({ token, subject }) => {
    return `token::${token}::OTAL::${subject}`;
};
exports.OTAL = OTAL;
const setRedis = async ({ key, value, ttl }) => {
    try {
        const data = typeof value === "object" ? JSON.stringify(value) : value;
        return ttl
            ? await redisConnection_1.redisClient.set(key, data, { EX: ttl })
            : await redisConnection_1.redisClient.set(key, data);
    }
    catch (error) {
        console.log("fail to set redis", error);
    }
};
exports.setRedis = setRedis;
const update = async ({ key, value, ttl }) => {
    try {
        if (!await redisConnection_1.redisClient.exists(key)) {
            return 0;
        }
        const data = typeof value === "object" ? JSON.stringify(value) : value;
        return ttl
            ? await redisConnection_1.redisClient.set(key, data, { EX: ttl })
            : await redisConnection_1.redisClient.set(key, data);
    }
    catch (error) {
        console.log("fail to update data redis", error);
    }
};
exports.update = update;
const getRedis = async (key) => {
    try {
        const data = await redisConnection_1.redisClient.get(key);
        if (!data)
            return console.log("key not exist");
        ;
        try {
            return JSON.parse(data);
        }
        catch (error) {
            return data;
        }
        return;
    }
    catch (error) {
        console.log("fail to get redis", error);
    }
};
exports.getRedis = getRedis;
const deleteRedis = async (key) => {
    try {
        return await redisConnection_1.redisClient.del(key);
    }
    catch (error) {
        console.log("fail to delete redis", error);
    }
};
exports.deleteRedis = deleteRedis;
const ttl = async (key) => {
    try {
        return await redisConnection_1.redisClient.ttl(key);
    }
    catch (error) {
        console.log("fail to get ttl redis", error);
    }
};
exports.ttl = ttl;
const increment = async (key) => {
    try {
        return await redisConnection_1.redisClient.incr(key);
    }
    catch (error) {
        console.log("fail to increment redis", error);
    }
};
exports.increment = increment;
