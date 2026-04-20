import z from "zod";
import { signUpSchema } from "./auth.validation";

export type signUpDto = z.infer<typeof signUpSchema.body>