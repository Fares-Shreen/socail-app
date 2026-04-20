import { hashSync, compareSync } from "bcrypt";
import { SALT_ROUNDS } from "../../../config/env.services";

export const hash = ({
    plainText,
    saltRounds = Number(SALT_ROUNDS || 12)
}: { plainText: string, saltRounds?: number }) => {
    return hashSync(plainText, saltRounds);
};

export const compare = ({ plainText, cipherText }: { plainText: string, cipherText: string }) => {
    return compareSync(plainText, cipherText);
};