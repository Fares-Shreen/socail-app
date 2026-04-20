import EventEmitter from "node:events";
import { SEND_EMAIL_EVENT } from "../../../config/env.services";

export const eventEmitter = new EventEmitter();

export const emailEventtEmitter = eventEmitter.on(SEND_EMAIL_EVENT as string, async (fn)=>{
    return fn();
});