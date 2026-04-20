"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.casheConnection = exports.redisClient = void 0;
const redis_1 = require("redis");
exports.redisClient = (0, redis_1.createClient)({
    url: "rediss://default:gQAAAAAAAQSzAAIncDFjODQ3ODVlOWQzYTM0OGJlYTM5YzZiZDViNWEyOTE0NnAxNjY3Mzk@comic-stork-66739.upstash.io:6379",
});
const casheConnection = async () => {
    try {
        await exports.redisClient.connect();
        console.log("success to connect with redis 😁");
    }
    catch (error) {
        console.log("fail to connect with redis", error);
    }
};
exports.casheConnection = casheConnection;
