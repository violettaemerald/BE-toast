import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        })
    }

    async upload (file: Express.Multer.File, folder: string): Promise<string>{
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {folder: `toast-app/${folder}`, resource_type: 'image'},
                (error, result) => {
                    if(error || !result) return reject(error)
                    resolve(result.secure_url)
                },
            ).end(file.buffer)
        })
    }

    async delete (url: string): Promise<void> {
        const parts = url.split('/')
        const filename = parts[parts.length - 1].split('.')[0]
        const folder = parts[parts.length - 2]
        await cloudinary.uploader.destroy(`${folder}/${filename}`)
    }
}