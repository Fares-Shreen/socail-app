"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const enum_1 = require("../../../common/enum/enum");
const userSchema = new mongoose_1.default.Schema({
    firstName: { type: String, required: true, trim: true, min: 3, max: 25 },
    lastName: { type: String, required: true, trim: true, min: 3, max: 25 },
    email: { type: String, required: true, unique: true, trim: true },
    age: { type: Number, required: true, min: 18, max: 60, trim: true },
    password: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    gender: { type: String, enum: Object.values(enum_1.genderEnum), trim: true },
    address: { type: String, trim: true },
    role: { type: String, enum: Object.values(enum_1.roleEnum), trim: true },
    confirmed: { type: Boolean, default: false },
    // createdAt: { type: Date, default: Date.now },
    // updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true
});
userSchema.virtual("userName").get(function () {
    return this.firstName + " " + this.lastName;
}).set(function (userName) {
    const parts = userName.split(" ");
    this.firstName = parts[0] || "";
    this.lastName = parts[1] || "";
});
const userModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = userModel;
