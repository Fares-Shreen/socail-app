import mongoose from "mongoose"
import { DBURL } from "../config/env.services";

const DBconnection = async () => {
  return await mongoose
    .connect(DBURL as string, {
      serverSelectionTimeoutMS: 3000,
    })
    .then(() => {
      console.log(`Data base connected successfully on ${DBURL}`);
    })
    .catch((err) => {
      console.log("Data base connection failed", err);
    });
}

export default DBconnection