import { NextFunction, Request, Response } from "express";
import { roleEnum } from "../enum/enum";
import { appError } from "../utils/global.error.handler";


const isAuthorized = (roles:roleEnum[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const role  = req.user?.role;
        if (!role) {
            throw new appError("Unauthorized", 401);
        }
        if (!roles.includes(role as roleEnum)) {
            throw new appError("Unauthorized", 403);
        }
        next();
    };
};

export default isAuthorized;