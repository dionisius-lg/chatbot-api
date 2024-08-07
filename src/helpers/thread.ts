import { Worker, WorkerOptions } from "worker_threads";
import path from "path";
import config from "./../config";

interface Data {
    columndata: Record<string, any>;
    rowdata: Record<string, any>[];
    filename?: string;
}

interface Result {
    success: boolean;
    error?: string;
}

interface ResultCreateExcel extends Result {
    filename?: string;
    filepath?: string;
    filesize?: number;
    mimetype?: string;
}
interface ResultReadExcel extends Result {
    data?: Record<string, any>[];
}

export const createExcel = (data: Data): Promise<ResultCreateExcel> => {
    return new Promise((resolve, reject) => {
        let resolvePath: string;
        let workerOptions: WorkerOptions = {
            workerData: data
        };

        switch (config.env) {
            case 'production':
                resolvePath = path.resolve(__dirname, 'create_excel.js');
                break;
            default:
                resolvePath = path.resolve(__dirname, 'create_excel.ts');
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

export const readExcel = (data: Express.Multer.File): Promise<ResultReadExcel> => {
    return new Promise((resolve) => {
        let resolvePath: string;
        let workerOptions: WorkerOptions = {
            workerData: data
        };

        switch (config.env) {
            case 'production':
                resolvePath = path.resolve(__dirname, 'read_excel.js');
                break;
            default:
                resolvePath = path.resolve(__dirname, 'read_excel.ts');
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

export const trainNetwork = (): Promise<ResultReadExcel> => {
    return new Promise((resolve) => {
        let resolvePath: string;
        let workerOptions: WorkerOptions = {};

        switch (config.env) {
            case 'production':
                resolvePath = path.resolve(__dirname, 'train_network.js');
                break;
            default:
                resolvePath = path.resolve(__dirname, 'train_network.ts');
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