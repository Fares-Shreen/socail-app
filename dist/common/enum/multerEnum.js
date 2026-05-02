"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multer_enum = exports.store_type_enum = void 0;
var store_type_enum;
(function (store_type_enum) {
    store_type_enum["disk"] = "disk";
    store_type_enum["memory"] = "memory";
})(store_type_enum || (exports.store_type_enum = store_type_enum = {}));
exports.multer_enum = {
    image: ["image/png", "image/jpeg", "image/jpg"],
    video: ["video/mp4"],
    pdf: ["application/pdf"],
};
