
import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import helmet from "helmet";
import { PORT } from "./config/env.services";
import { rateLimit } from 'express-rate-limit'
import { appError, globalErrorHandler } from "./common/utils/global.error.handler";
import authRouter from "./modules/authModule/auth.controller";
import DBconnection from "./DB/DB.connection";
import redisService from "./cache/redis.service";




const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
})
const bootStrap = () => {
    const app: express.Application = express()
    app.use(cors(), express.json(), helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        dnsPrefetchControl: false,
        frameguard: false,
        hidePoweredBy: false,
        hsts: false,
        ieNoOpen: false,
        noSniff: false,
        originAgentCluster: false,
        permittedCrossDomainPolicies: false,
        referrerPolicy: false,
        xssFilter: false,
    }), limiter)
    const  _redisService = redisService;

    DBconnection()
    redisService.casheConnection()

    app.get("/", (req: Request, res: Response, next: NextFunction) => res.send("hello world"))
    app.use("/auth", authRouter)
    app.use("/{*demo}", (req: Request, res: Response, next: NextFunction) => {
        throw new appError("not found", 500)
    }

    );

    app.use(globalErrorHandler)
    app.listen(PORT, () => {
        console.log(`app is running on port ${PORT}`);

    })

}

export default bootStrap