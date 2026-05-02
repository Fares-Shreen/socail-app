
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, GetObjectCommandOutput, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION, AWS_SECRET_ACCESS_KEY } from "../../config/env.services";
import { store_type_enum } from "../enum/multerEnum";
import fs from "fs";
import { randomUUID } from "node:crypto";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { get } from "node:http";


export class S3service {

    private client: S3Client
    constructor() {
        this.client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });
    }

    async uploadFile({
        file,
        store_type = store_type_enum.memory,
        path = "General",
        ACL = ObjectCannedACL.private,
    }: {
        file: Express.Multer.File,
        store_type?: store_type_enum,
        path?: string,
        ACL?: ObjectCannedACL,

    }): Promise<string> {

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `socail_media_app/${path}/${randomUUID()}/${file.originalname}`,
            Body: store_type === store_type_enum.memory ? file.buffer : fs.createReadStream(file.path),
            ACL,
            ContentType: file.mimetype
        });
        if (!command.input.Key) {
            throw new Error("Error uploading file");
        }

        await this.client.send(command);
        return command.input.Key;
    }

    async uploadLargeFile({
        file,
        store_type = store_type_enum.disk,
        path = "General",
        ACL = ObjectCannedACL.private,
    }: {
        file: Express.Multer.File,
        store_type?: store_type_enum,
        path?: string,
        ACL?: ObjectCannedACL,
    }): Promise<string> {

        const command = new Upload({
            client: this.client,
            params: {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `socail_media_app/${path}/${randomUUID()}/${file.originalname}`,
                Body: store_type === store_type_enum.memory ? file.buffer : fs.createReadStream(file.path),
                ACL,
                ContentType: file.mimetype
            }
        });

        const result = await command.done();
        command.on("httpUploadProgress", (progress) => {
            console.log(progress);
        })

        return result.Key as string;
    }

    async uploadFiles({
        files,
        store_type = store_type_enum.memory,
        path = "General",
        ACL = ObjectCannedACL.private,
        isLarge = false,
    }: {
        files: Express.Multer.File[],
        store_type?: store_type_enum,
        path?: string,
        ACL?: ObjectCannedACL,
        isLarge?: boolean
    }) {

        let urls: string[] = [];
        if (isLarge) {
            urls = await Promise.all(files.map(async (file) => { return this.uploadLargeFile({ file, store_type, path, ACL }) }))
        } else {
            urls = await Promise.all(files.map(async (file) => { return this.uploadFile({ file, store_type, path, ACL }) }))
        }
        return urls
    }

    async createPresignedUrl({ 
        contentType,
        path,
        fileName,
        expireIn = 3600 }: {
            contentType: string,
            path: string,
            fileName: string,
            expireIn?: number
        }) {
        {
            const key = `socail_media_app/${path}/${randomUUID()}/${fileName}`;
            const command = new PutObjectCommand({
                Bucket: AWS_BUCKET_NAME,
                Key: key,
                ContentType: contentType,
            });
            const url = await getSignedUrl(this.client, command, { expiresIn: expireIn });
            return { url, key };
        }

    }
    async getFile(key: string): Promise<GetObjectCommandOutput> {
        const comand = new GetObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: key
        }
        )

        return await this.client.send(comand)
    }
    async getFilePresignedUrl( { key, expireIn = 3600, download = false }: { key: string; expireIn?: number; download?: boolean; }): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: download ? `attachment; filename=${key.split("/").pop()}` : undefined
        });
        const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
        return url;
    }

    async getFiles(folderName: string) {
        const command = new ListObjectsV2Command({
            Bucket: AWS_BUCKET_NAME,
            Prefix: `socail_media_app/${folderName}`,
        });
        return await this.client.send(command);
    }

    async deleteFile(key: string) {
        const command = new DeleteObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: key,
        });
        return await this.client.send(command);
    }
    async deleteFiles(keys: string[]) {
        const command = new DeleteObjectsCommand({
            Bucket: AWS_BUCKET_NAME,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
                Quiet: true,
            },
        });
        return await this.client.send(command);
    }


}
