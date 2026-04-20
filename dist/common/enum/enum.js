"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerEnum = exports.roleEnum = exports.genderEnum = void 0;
var genderEnum;
(function (genderEnum) {
    genderEnum["male"] = "male";
    genderEnum["female"] = "female";
})(genderEnum || (exports.genderEnum = genderEnum = {}));
var roleEnum;
(function (roleEnum) {
    roleEnum["admin"] = "admin";
    roleEnum["user"] = "user";
})(roleEnum || (exports.roleEnum = roleEnum = {}));
var providerEnum;
(function (providerEnum) {
    providerEnum["google"] = "google";
    providerEnum["system"] = "system";
})(providerEnum || (exports.providerEnum = providerEnum = {}));
