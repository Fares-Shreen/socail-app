"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_services_1 = require("../config/env.services");
const DBconnection = async () => {
    return await mongoose_1.default
        .connect(env_services_1.DBURL, {
        serverSelectionTimeoutMS: 3000,
    })
        .then(() => {
        console.log(`Data base connected successfully on ${env_services_1.DBURL}`);
    })
        .catch((err) => {
        console.log("Data base connection failed", err);
    });
};
exports.default = DBconnection;
