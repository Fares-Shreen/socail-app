"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_services_1 = require("./config/env.services");
const express_rate_limit_1 = require("express-rate-limit");
const global_error_handler_1 = require("./common/utils/global.error.handler");
const auth_controller_1 = __importDefault(require("./modules/authModule/auth.controller"));
const DB_connection_1 = __importDefault(require("./DB/DB.connection"));
const redis_service_1 = __importDefault(require("./cache/redis.service"));
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
});
const bootStrap = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)(), express_1.default.json(), (0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        dnsPrefetchControl: false,
        frameguard: false,
        hidePoweredBy: false,
        hsts: false,
        ieNoOpen: false,
        noSniff: false,
        originAgentCluster: false,
        permittedCrossDomainPolicies: false,
        referrerPolicy: false,
        xssFilter: false,
    }), limiter);
    const _redisService = redis_service_1.default;
    (0, DB_connection_1.default)();
    redis_service_1.default.casheConnection();
    app.get("/", (req, res, next) => res.send("hello world"));
    app.use("/auth", auth_controller_1.default);
    app.use("/{*demo}", (req, res, next) => {
        throw new global_error_handler_1.appError("not found", 500);
    });
    app.use(global_error_handler_1.globalErrorHandler);
    app.listen(env_services_1.PORT, () => {
        console.log(`app is running on port ${env_services_1.PORT}`);
    });
};
exports.default = bootStrap;
