"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AuthServices {
    constructor() { }
    signUp(req, res, next) {
        res.status(200).json({ message: "success signup" });
    }
    signIn(req, res, next) {
        res.status(200).json({ message: "success signin" });
    }
}
exports.default = new AuthServices();
