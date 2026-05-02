"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const enum_1 = require("../../common/enum/enum");
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, trim: true, minlength: 3, maxlength: 25 },
    lastName: { type: String, required: true, trim: true, minlength: 3, maxlength: 25 },
    email: { type: String, required: true, unique: true, trim: true },
    age: { type: Number, min: 18, max: 60 },
    password: {
        type: String, required: function () {
            return this.provider === enum_1.providerEnum.system ? true : false;
        },
        trim: true
    },
    phone: { type: String, trim: true },
    gender: { type: String, enum: Object.values(enum_1.genderEnum) },
    provider: { type: String, required: true, enum: Object.values(enum_1.providerEnum) },
    address: { type: String, trim: true },
    role: { type: String, enum: Object.values(enum_1.roleEnum), default: enum_1.roleEnum.user },
    profileImageUrl: { type: String, default: null },
    confirmed: { type: Boolean, default: false },
    changeCredentials: { type: Date, default: Date.now() },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
});
userSchema.virtual("userName")
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
})
    .set(function (userName) {
    const parts = userName.split(" ");
    this.firstName = parts[0] || "";
    this.lastName = parts[1] || "";
});
// userSchema.pre(["findOne", "find", "findOneAndUpdate"], function () {
//     console.log(this.getQuery());
//     const {paranoid,...rest} = this.getQuery();
//     if (paranoid==false) {
//         this.setQuery({...rest});
//     }
//     else{
//         this.setQuery({...rest,deletedAt:{$exists:false}});
//     }
// })    
const userModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = userModel;
