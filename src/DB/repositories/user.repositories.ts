import { Model } from "mongoose";
import baseRepository from "./base.repositories";
import userModel, { IUser } from "../models/userModel";


class userRepository extends baseRepository<IUser> {
    constructor(model: Model<IUser> = userModel) {
        super(model);
    }
}

export default new userRepository;
