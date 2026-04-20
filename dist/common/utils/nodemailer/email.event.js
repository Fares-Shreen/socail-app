"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEventtEmitter = exports.eventEmitter = void 0;
const node_events_1 = __importDefault(require("node:events"));
const env_services_1 = require("../../../config/env.services");
exports.eventEmitter = new node_events_1.default();
exports.emailEventtEmitter = exports.eventEmitter.on(env_services_1.SEND_EMAIL_EVENT, async (fn) => {
    return fn();
});
