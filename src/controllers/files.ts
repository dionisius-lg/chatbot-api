import { Request, Response } from "express";
import { existsSync } from "fs";
import { sendBadRequest } from "./../helpers/response";
import { decrypt } from "./../helpers/encryption";

export const download = async (req: Request, res: Response) => {
    const { params: { id } } = req;

    try {
        const decrypted = decrypt(id);
        const decryptedObject = JSON.parse(decrypted);

        const mimetype = decryptedObject?.mimetype || '';
        const filename = decryptedObject?.filename || '';
        const path = decryptedObject?.path || '';
        const size = decryptedObject?.size || 0;

        if (!existsSync(path)) {
            throw new Error('File not found');
        }

        res.set({
            'Content-Disposition': `attachment; filename=${filename}`,
            'Content-Type': mimetype,
            'Content-Length': size
        });

        return res.download(path, (err) => {
            if (err) {
                throw new Error('File cannot be downloaded');
            }
        });
    } catch (err: any) {
        return sendBadRequest(res, err?.message)
    }
};