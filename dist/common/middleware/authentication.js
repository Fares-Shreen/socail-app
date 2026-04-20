"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const global_error_handler_1 = require("../utils/global.error.handler");
const user_repositories_1 = __importDefault(require("../../DB/repositories/user.repositories"));
const redis_service_1 = __importDefault(require("../../cache/redis.service"));
const env_services_1 = require("../../config/env.services");
const isAthenticated = async (req, res, next) => {
    const header = req.headers.authorization;
    console.log(header);
    const _userModel = user_repositories_1.default;
    if (!header) {
        throw new Error("No token found");
    }
    const tokenType = header.split(" ")[0];
    const token = header.split(" ")[1];
    if (!token) {
        throw new Error("No token found");
    }
    let accessToken = "";
    if (tokenType === env_services_1.USER) {
        accessToken = env_services_1.ACCESS_TOKEN_ACCESS_USER;
    }
    else if (tokenType === env_services_1.ADMIN) {
        accessToken = env_services_1.ACCESS_TOKEN_ACCESS_ADMIN;
    }
    else {
        throw new Error("Invalid token type");
    }
    const decoded = jsonwebtoken_1.default.verify(token, accessToken);
    const _redisService = redis_service_1.default;
    if (!decoded) {
        throw new Error("Invalid token");
    }
    const user = await _userModel.findById(decoded.id);
    if (!user) {
        throw new Error("User not found");
    }
    const jwtIat = decoded.iat;
    if (user.changeCredentials.getTime() > jwtIat * 1000) {
        throw new Error("you need to login again");
    }
    if (!user.confirmed) {
        throw new Error("User not confirmed");
    }
    const revokeToken = await _redisService.getRedis(_redisService.revokedKey({ userId: user.id, jti: decoded.jti }));
    if (revokeToken) {
        throw new global_error_handler_1.appError("Unauthenticated", 401);
    }
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.default = isAthenticated;
