"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.hash = void 0;
const bcrypt_1 = require("bcrypt");
const env_services_1 = require("../../../config/env.services");
const hash = ({ plainText, saltRounds = Number(env_services_1.SALT_ROUNDS || 12) }) => {
    return (0, bcrypt_1.hashSync)(plainText, saltRounds);
};
exports.hash = hash;
const compare = ({ plainText, cipherText }) => {
    return (0, bcrypt_1.compareSync)(plainText, cipherText);
};
exports.compare = compare;
