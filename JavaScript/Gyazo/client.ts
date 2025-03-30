// 2025/01/16 17:02
import type { ImageData, UploadRequest, UploadResponse } from "./type.ts";

export class GyazoClient {
    token: string;
    constructor(token: string) {
        this.token = token;
    }
    list = async (page = 1, per_page = 20) => {
        return await fetch(`https://api.gyazo.com/api/images?access_token=${this.token}&page=${page}&per_page=${per_page}`)
            /*
            return await fetch('https://api.gyazo.com/api/images', {
                method: 'POST',
                body: JSON.stringify({
                    access_token: this.token,
                    page: page,
                    per_page: per_page,
                }),
            })
                */
            .then(response => response.json())
            .then(json => json as ImageData[])
    }
    image = async (imageId: string) => {
        return await fetch(`https://api.gyazo.com/api/images/${imageId}?access_token=${this.token}`)
            /*
            return await fetch('https://api.gyazo.com/api/images/' + imageId, {
                method: 'GET',
                body: JSON.stringify({
                    access_token: this.token,
                }),
            })
            */
            .then(response => response.json())
            .then(json => json as ImageData)
    }
    upload = async (req: UploadRequest | FormData) => {
        const obj = Object.assign(req, { access_token: this.token });
        return await fetch('https://upload.gyazo.com/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: JSON.stringify(obj),
        })
            .then(response => response.json())
            .then(json => json as UploadResponse)
    }
    uploadWithURL = async (req: {
        src: string,
        url?: string,
        title?: string,
        description?: string,
        date?: Date,
    }) => {
        const imageBlob = await fetch(req.src).then(response => response.blob());
        const formData = new FormData();
        formData.append('imagedata', imageBlob, req.title);
        formData.append('access_token', this.token);
        formData.append('access_policy', 'anyone');
        formData.append('metadata_is_public', 'false');
        if (req.url) formData.append('referer_url', req.url);
        if (req.title) formData.append('title', req.title);
        if (req.description) formData.append('desc', req.description);
        if (req.date) formData.append('created_at', Math.floor(req.date.getTime() / 1000).toString());
        return await fetch('https://upload.gyazo.com/api/upload', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(json => json as UploadResponse)
    }
    uploadBinary = async (req: {
        binary: Uint8Array,
        type: string,
        title: string,
        description?: string,
        date?: Date,
    }) => {
        const imageBlob = new Blob([req.binary], { type: req.type });
        const formData = new FormData();
        formData.append('imagedata', imageBlob, req.title);
        formData.append('access_token', this.token);
        formData.append('access_policy', 'anyone');
        formData.append('metadata_is_public', 'false');
        if (req.title) formData.append('title', req.title);
        if (req.description) formData.append('desc', req.description);
        if (req.date) formData.append('created_at', Math.floor(req.date.getTime() / 1000).toString());
        return await fetch('https://upload.gyazo.com/api/upload', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(json => json as UploadResponse)
    }
}
