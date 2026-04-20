"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handler_1 = require("../utils/global.error.handler");
const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                validationErrors.push(result.error.message);
            }
        }
        if (validationErrors.length > 0) {
            throw new global_error_handler_1.appError(JSON.parse(validationErrors), 400);
        }
        next();
    };
};
exports.default = validation;
