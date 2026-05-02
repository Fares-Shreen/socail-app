"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_services_1 = require("../../config/env.services");
const multerEnum_1 = require("../enum/multerEnum");
const fs_1 = __importDefault(require("fs"));
const node_crypto_1 = require("node:crypto");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: env_services_1.AWS_REGION,
            credentials: {
                accessKeyId: env_services_1.AWS_ACCESS_KEY,
                secretAccessKey: env_services_1.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadFile({ file, store_type = multerEnum_1.store_type_enum.memory, path = "General", ACL = client_s3_1.ObjectCannedACL.private, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `socail_media_app/${path}/${(0, node_crypto_1.randomUUID)()}/${file.originalname}`,
            Body: store_type === multerEnum_1.store_type_enum.memory ? file.buffer : fs_1.default.createReadStream(file.path),
            ACL,
            ContentType: file.mimetype
        });
        if (!command.input.Key) {
            throw new Error("Error uploading file");
        }
        await this.client.send(command);
        return command.input.Key;
    }
    async uploadLargeFile({ file, store_type = multerEnum_1.store_type_enum.disk, path = "General", ACL = client_s3_1.ObjectCannedACL.private, }) {
        const command = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `socail_media_app/${path}/${(0, node_crypto_1.randomUUID)()}/${file.originalname}`,
                Body: store_type === multerEnum_1.store_type_enum.memory ? file.buffer : fs_1.default.createReadStream(file.path),
                ACL,
                ContentType: file.mimetype
            }
        });
        const result = await command.done();
        command.on("httpUploadProgress", (progress) => {
            console.log(progress);
        });
        return result.Key;
    }
    async uploadFiles({ files, store_type = multerEnum_1.store_type_enum.memory, path = "General", ACL = client_s3_1.ObjectCannedACL.private, isLarge = false, }) {
        let urls = [];
        if (isLarge) {
            urls = await Promise.all(files.map(async (file) => { return this.uploadLargeFile({ file, store_type, path, ACL }); }));
        }
        else {
            urls = await Promise.all(files.map(async (file) => { return this.uploadFile({ file, store_type, path, ACL }); }));
        }
        return urls;
    }
    async createPresignedUrl({ contentType, path, fileName, expireIn = 3600 }) {
        {
            const key = `socail_media_app/${path}/${(0, node_crypto_1.randomUUID)()}/${fileName}`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: env_services_1.AWS_BUCKET_NAME,
                Key: key,
                ContentType: contentType,
            });
            const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: expireIn });
            return { url, key };
        }
    }
    async getFile(key) {
        const comand = new client_s3_1.GetObjectCommand({
            Bucket: env_services_1.AWS_BUCKET_NAME,
            Key: key
        });
        return await this.client.send(comand);
    }
    async getFilePresignedUrl({ key, expireIn = 3600, download = false }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: env_services_1.AWS_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: download ? `attachment; filename=${key.split("/").pop()}` : undefined
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: 3600 });
        return url;
    }
    async getFiles(folderName) {
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: env_services_1.AWS_BUCKET_NAME,
            Prefix: `socail_media_app/${folderName}`,
        });
        return await this.client.send(command);
    }
    async deleteFile(key) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: env_services_1.AWS_BUCKET_NAME,
            Key: key,
        });
        return await this.client.send(command);
    }
    async deleteFiles(keys) {
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket: env_services_1.AWS_BUCKET_NAME,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
                Quiet: true,
            },
        });
        return await this.client.send(command);
    }
}
exports.S3service = S3service;
