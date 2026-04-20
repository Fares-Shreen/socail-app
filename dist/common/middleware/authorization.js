"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handler_1 = require("../utils/global.error.handler");
const isAuthorized = (roles) => {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role) {
            throw new global_error_handler_1.appError("Unauthorized", 401);
        }
        if (!roles.includes(role)) {
            throw new global_error_handler_1.appError("Unauthorized", 403);
        }
        next();
    };
};
exports.default = isAuthorized;
