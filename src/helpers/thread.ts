import { Worker, WorkerOptions } from "worker_threads";
import path from "path";
import config from "./../config";

interface CreateExcel {
    columndata: Record<string, any>;
    rowdata: Record<string, any>[];
    filename?: string;
}

interface Message {
    success: boolean;
    filename?: string;
    filepath?: string;
    filesize?: number;
    mimetype?: string;
    error?: string;
}

export const createExcel = (data: CreateExcel): Promise<Message> => {
    return new Promise((resolve, reject) => {
        let resolvePath: string;
        let workerOptions: WorkerOptions ={
            workerData: data
        };

        switch (config.env) {
            case 'production':
                resolvePath = path.resolve(__dirname, 'create-excel.js');
                break;
            default:
                resolvePath = path.resolve(__dirname, 'create-excel.ts');
                workerOptions.execArgv = /\.ts$/.test(resolvePath) ? ["--require", "ts-node/register"] : undefined;
                break;
        }

        const worker = new Worker(resolvePath, workerOptions);

        worker.on('message', (message) => resolve(message));

        worker.on('error', (err) => resolve({
            success: false,
            error: err?.message
        }));

        worker.on('exit', (code) => {
            if (code !==0) resolve({
                success: false,
                error: `Worker stopped with exit code ${code}`
            });
        });
    });
};
