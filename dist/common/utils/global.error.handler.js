"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.appError = void 0;
class appError extends Error {
    message;
    statusCode;
    constructor(message, statusCode) {
        super();
        this.message = message;
        this.statusCode = statusCode;
        this.message = message,
            this.statusCode = statusCode;
    }
}
exports.appError = appError;
const globalErrorHandler = (err, req, res, next) => {
    const status = err.statusCode || 500;
    res
        .status(status)
        .json({
        message: err.message,
        status,
        stack: err.stack
    });
};
exports.globalErrorHandler = globalErrorHandler;
