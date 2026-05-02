import mongoose, { Schema, Document, Model } from "mongoose";
import { genderEnum, providerEnum, roleEnum } from "../../common/enum/enum";

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    password: string;
    phone?: string;
    gender?: genderEnum;
    address?: string;
    role?: roleEnum;
    provider?: providerEnum;
    confirmed: boolean;
    changeCredentials: Date;
    profileImageUrl?: string;
    userName: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

const userSchema: Schema<IUser> = new Schema(
    {
        firstName: { type: String, required: true, trim: true, minlength: 3, maxlength: 25 },
        lastName: { type: String, required: true, trim: true, minlength: 3, maxlength: 25 },
        email: { type: String, required: true, unique: true, trim: true },
        age: { type: Number, min: 18, max: 60 },
        password: {
            type: String, required: function () {
                return this.provider === providerEnum.system ? true : false;
            }
            , trim: true
        },
        phone: { type: String, trim: true },
        gender: { type: String, enum: Object.values(genderEnum) },
        provider: { type: String, required: true, enum: Object.values(providerEnum) },
        address: { type: String, trim: true },
        role: { type: String, enum: Object.values(roleEnum), default: roleEnum.user },
        profileImageUrl: { type: String, default: null },
        confirmed: { type: Boolean, default: false },
        changeCredentials: { type: Date, default: Date.now() },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        strict: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        strictQuery: true,
    }
);



userSchema.virtual("userName")
    .get(function (this: IUser) {
        return `${this.firstName} ${this.lastName}`;
    })
    .set(function (this: IUser, userName: string) {
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

const userModel: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default userModel;