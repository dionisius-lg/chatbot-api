import { Request, Response } from "express";
import { existsSync } from "fs";
import { sendBadRequest } from "./../helpers/response";
import { decrypt } from "./../helpers/encryption";

export const download = async (req: Request, res: Response) => {
    const { params: { id } } = req;

    try {
        const decrypted = decrypt(id);
        const decryptedObject = JSON.parse(decrypted);

        const filename = decryptedObject?.filename || '';
        const filepath = decryptedObject?.filepath || '';
        const filesize = decryptedObject?.filesize || 0;
        const mimetype = decryptedObject?.mimetype || '';
        const fullpath = (`${filepath}/${filename}`).replace(/\/+/g, '/');

        if (!existsSync(fullpath)) {
            throw new Error('File not found');
        }

        res.set({
            'Content-Disposition': `attachment; filename=${filename}`,
            'Content-Type': mimetype,
            'Content-Length': filesize
        });

        return res.download(fullpath, (err) => {
            if (err) {
                throw new Error('File cannot be downloaded');
            }
        });
    } catch (err: any) {
        return sendBadRequest(res, err?.message)
    }
};