import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { appError } from '../utils/global.error.handler';
import userRepositories from '../../DB/repositories/user.repositories';
import { IUser } from '../../DB/models/userModel';
import { HydratedDocument } from 'mongoose';
import redisService from '../../cache/redis.service';
import { ACCESS_TOKEN_ACCESS_ADMIN, ACCESS_TOKEN_ACCESS_USER, ADMIN, USER } from "../../config/env.services";


declare global {
    namespace Express {
        interface Request {
            user?: HydratedDocument<IUser>;
            decoded?: JwtPayload;
        }

    }
}

const isAthenticated = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    console.log(header);
    
    const _userModel = userRepositories;


    if (!header ) {
        throw new Error("No token found");
    }
    const tokenType = header.split(" ")[0];

    const token = header.split(" ")[1];

    if (!token) {
        throw new Error("No token found");
    }

        let accessToken = "";
        if (tokenType === USER) {
            accessToken = ACCESS_TOKEN_ACCESS_USER!;
        } else if (tokenType === ADMIN) {
            accessToken = ACCESS_TOKEN_ACCESS_ADMIN!;
        }
        else {
            throw new Error("Invalid token type");
        }

        const decoded = jwt.verify(token, accessToken as string) as JwtPayload;
        const _redisService = redisService;

        if (!decoded) {
            throw new Error("Invalid token");
        }

        const user = await _userModel.findById(decoded.id as any);
        if (!user) {
            throw new Error("User not found");
        }
        const jwtIat = decoded.iat as number;
        if (user.changeCredentials.getTime() > jwtIat * 1000) {
            throw new Error("you need to login again");
        }

        if (!user.confirmed) {
            throw new Error("User not confirmed");
        }
        const revokeToken = await _redisService.getRedis(_redisService.revokedKey({ userId: user.id as string, jti: decoded.jti as string }));
        if (revokeToken) {
            throw new appError("Unauthenticated", 401);
        }

        req.user = user;
        req.decoded = decoded;

        next();
    } 


export default isAthenticated