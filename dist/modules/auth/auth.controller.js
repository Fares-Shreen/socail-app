"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_service_1 = __importDefault(require("./auth.service"));
const validation_1 = __importDefault(require("../../common/middleware/validation"));
const auth_validation_1 = require("./auth.validation");
const authRouter = express_1.default.Router();
authRouter.post("/signUp", (0, validation_1.default)(auth_validation_1.signUpSchema), auth_service_1.default.signUp);
authRouter.post("/signIn", auth_service_1.default.signIn);
exports.default = authRouter;
