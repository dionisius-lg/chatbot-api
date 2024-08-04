import { workerData, parentPort } from "worker_threads";
import exceljs from "exceljs";
import { createReadStream, unlinkSync } from "fs";

interface Result {
    [key: string]: any;
}

const readExcel = async (file: Express.Multer.File): Promise<Result[]> => {
    try {
        const stream = createReadStream(file.path);
        const workbook = new exceljs.stream.xlsx.WorkbookReader(stream, {});

        let headers: string[] = [];
        let result: Result[] = [];

        for await (const worksheetReader of workbook) {
            let firstRowProcessed = false;

            for await (const row of worksheetReader) {
                if (row && row.values && row.values instanceof Array) {
                    if (!firstRowProcessed) {
                        row.values.slice(1).forEach((cell) => {
                            if (cell) {
                                let value = `${cell}`.toLowerCase().replace(/[^0-9a-z ]/gi, '').replace( /\s\s+/g, ' ').replace(/ /g,"_");
                                headers.push(value);
                            }
                        });

                        firstRowProcessed = true;
                    } else {
                        let rowData: Record<string, any> = {};

                        row.values.slice(1).forEach((cell, i) => {
                            if (headers[i]) {
                                rowData[headers[i]] = cell;
                            }
                        });

                        result.push(rowData);
                    }
                }
            }

            // exit after processing the first worksheet
            break;
        }

        // remove file
        unlinkSync(file.path);

        return result;
    } catch (err: any) {
        console.log(err)
        return err
    }
};

readExcel(workerData)
    .then((result: Result[]) => {
        parentPort?.postMessage({ success: true, data: result });
    })
    .catch((err) => {
        parentPort?.postMessage({ success: false, error: err.message });
    });