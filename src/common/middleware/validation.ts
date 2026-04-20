import { NextFunction, Request, Response } from "express";
import {ZodType} from "zod";
import { appError } from "../utils/global.error.handler";

type reqType = keyof Request
type schemaInterface = Partial<Record<reqType, ZodType>>

const validation = (schema:schemaInterface)=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        const validationErrors = []
        for (const key of Object.keys(schema) as reqType[]) {
            if (!schema[key]) continue;
            const result = schema[key].safeParse(req[key])
            if (!result.success) {
                validationErrors.push(result.error.message)
            }
        }
        if (validationErrors.length > 0) {
            throw new appError(JSON.parse(validationErrors as unknown as string), 400)
        }
        next()
    }
}

export default validation