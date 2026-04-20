"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const env_services_1 = require("../config/env.services");
class redisService {
    redisClient;
    constructor() {
        this.redisClient = (0, redis_1.createClient)({
            url: env_services_1.REDIS_URL
        });
    }
    async casheConnection() {
        try {
            await this.redisClient.connect();
            console.log("success to connect with redis 😁");
        }
        catch (error) {
            console.log("fail to connect with redis", error);
        }
    }
    revokedKey = ({ userId, jti }) => {
        return `revokeToken::${userId}::${jti}`;
    };
    getAllRevokedKeys = ({ userId }) => {
        return `revokeToken::${userId}::*`;
    };
    otpKey = ({ email, subject }) => {
        return `otp::${email}::${subject}`;
    };
    block_otp_key = ({ email, subject }) => {
        return `block_otp::${email}::${subject}`;
    };
    max_otp_key = ({ email, subject }) => {
        return `max_otp::${email}::${subject}`;
    };
    OTAL = ({ token, subject }) => {
        return `token::${token}::OTAL::${subject}`;
    };
    setRedis = async ({ key, value, ttl }) => {
        try {
            const data = typeof value === "object" ? JSON.stringify(value) : value;
            return ttl
                ? await this.redisClient.set(key, data, { EX: ttl })
                : await this.redisClient.set(key, data);
        }
        catch (error) {
            console.log("fail to set redis", error);
        }
    };
    update = async ({ key, value, ttl }) => {
        try {
            if (!await this.redisClient.exists(key)) {
                return 0;
            }
            const data = typeof value === "object" ? JSON.stringify(value) : value;
            return ttl
                ? await this.redisClient.set(key, data, { EX: ttl })
                : await this.redisClient.set(key, data);
        }
        catch (error) {
            console.log("fail to update data redis", error);
        }
    };
    getRedis = async (key) => {
        try {
            const data = await this.redisClient.get(key);
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
    deleteRedis = async (key) => {
        try {
            return await this.redisClient.del(key);
        }
        catch (error) {
            console.log("fail to delete redis", error);
        }
    };
    ttl = async (key) => {
        try {
            return await this.redisClient.ttl(key);
        }
        catch (error) {
            console.log("fail to get ttl redis", error);
        }
    };
    increment = async (key) => {
        try {
            return await this.redisClient.incr(key);
        }
        catch (error) {
            console.log("fail to increment redis", error);
        }
    };
}
exports.default = new redisService();
