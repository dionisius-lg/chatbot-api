import { workerData, parentPort } from "worker_threads";
import exceljs from "exceljs";
import { createReadStream } from "fs";

interface Result {
    [key: string]: any;
}

const readExcel = async (file: Express.Multer.File): Promise<Result[]> => {
    try {
        let result: Result[] = [];
        let headers: string[] = [];

        const stream = createReadStream(file.path);
        const workbook = new exceljs.stream.xlsx.WorkbookReader(stream, {
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            worksheets: 'emit',
            entries: 'ignore',
            styles: 'ignore'
        });

        for await (const worksheet of workbook) {
            for await (const row of worksheet) {
                const { model } = row;

                if (model?.cells instanceof Array && model.cells.length > 0) {
                    switch (model.number) {
                        case 1:
                            model.cells.forEach((cell, i) => {
                                let value = `${cell.value}`.toLowerCase().replace(/[^0-9a-z ]/gi, '').replace( /\s\s+/g, ' ').replace(/ /g,"_");
                                headers.push(value);
                            });
                            break;
                        default:
                            let rowData: Record<string, any> = {};
                            model.cells.forEach((cell, i) => {
                                if (headers[i]) {
                                    rowData[headers[i]] = cell.value;
                                }
                            });
                            result.push(rowData);
                            break;
                    }
                }
            }

            // exit after processing the first worksheet
            break;
        }

        stream.close();

        return result;
    } catch (err: any) {
        throw err;
    }
};

readExcel(workerData)
    .then((result: Result[]) => {
        parentPort?.postMessage({ success: true, data: result });
    })
    .catch((err: any) => {
        parentPort?.postMessage({ success: false, error: err.message });
    });
