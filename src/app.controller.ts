
import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import helmet from "helmet";
import { PORT } from "./config/env.services";
import { rateLimit } from 'express-rate-limit'
import { appError, globalErrorHandler } from "./common/utils/global.error.handler";
import authRouter from "./modules/authModule/auth.controller";
import DBconnection from "./DB/DB.connection";
import redisService from "./cache/redis.service";
import { S3service } from "./common/service/s3.service";
import { pipeline } from "node:stream/promises";
import { string } from "zod";





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
    const _redisService = redisService;
    const _S3Service = new S3service()

    DBconnection()
    redisService.casheConnection()

    app.get("/", (req: Request, res: Response, next: NextFunction) => res.send("hello world"))
    app.get("/deleteFile/:path", async (req: Request, res: Response, next: NextFunction) => {
        if (!req.params.path) {
            throw new appError("missing key", 408)
        }
        const key = req.params.path as string
        const data = await _S3Service.deleteFile(key)
        res.status(200).json({ message: "success", data })

    })
    app.get("/deleteFiles", async (req: Request, res: Response, next: NextFunction) => {
        if (!req.body.keys) {
            throw new appError("missing keys", 408)
        }
        const keys = req.body.keys as string[]
        const data = await _S3Service.deleteFiles(keys)
        res.status(200).json({ message: "success", data })

})
    app.get("/getFiles/:folderName", async (req: Request, res: Response, next: NextFunction) => {


        if (!req.params.folderName) {
            throw new appError("missing asset url", 408)
        }
        const folderName = req.params.folderName as string
        const data  = await _S3Service.getFiles(folderName) 
        const finalData = data.Contents?.map(item => {
            return {
                key: item.Key,
            }
        })
        res.status(200).json({ message: "success", data: finalData })
    })
    app.get("/getPresignedUrl/*path", async (req: Request, res: Response, next: NextFunction) => {
        if (!req.params.path) {
            throw new appError("missing asset url", 408)
        }
        const path = req.params.path as string[]
        const key = path.join("/")
        if (req.query.download =="true") {
            const url = await _S3Service.getFilePresignedUrl({ key, expireIn: 3600, download: true })
            res.status(200).json({ message: "success", url })
        }
        
    })

    app.get("/upload/*path", async (req: Request, res: Response, next: NextFunction) => {
        if (!req.params.path) {
            throw new appError("missing asset url", 408)
        }
        const path = req.params.path as string[] 
        const key = path.join("/")
        const data = await _S3Service.getFile(key) 
        if (!data) {
            throw new appError("file not found", 404)
        }
        const stream = data.Body as NodeJS.ReadableStream
        res.setHeader("Content-Type", data.ContentType as string)
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        if (req.query.download == "true") {
            res.setHeader("Content-Disposition", `attachment; filename=${path[0]}`)
        }
        await pipeline(stream, res)
    })

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