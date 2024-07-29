import { workerData, parentPort } from "worker_threads";
import exceljs from "exceljs";
import { existsSync, mkdirSync, createWriteStream, statSync } from "fs";
import config from "../config";
import { isEmpty, randomString, excelColumnName } from "./value";

const { file_dir } = config;

interface WorkerData {
    columndata: Record<string, any>;
    rowdata: Record<string, any>[];
    filename?: string;
}

interface Columns {
    header: string;
    key: string;
    width?: number;
}

interface Result {
    filename: string;
    filepath: string;
    filesize: number;
    mimetype: string;
}

const data: WorkerData = workerData;

const createExcel = async ({ columndata, rowdata, filename }: WorkerData): Promise<Result> => {
    if (filename) {
        filename = filename.split('.')[0].trim();
    } else {
        filename = 'output';
    }

    // replace multiple space with one space
    filename = filename.replace( /\s\s+/g, ' ');
    // replace space with underscore
    filename = filename.replace(/ /g,"_");
    // concat with random string and file extension
    filename += `-${randomString(16, true)}.xlsx`;

    let filepath: string = `${file_dir}/excel`;

    if (!existsSync(filepath)) {
        mkdirSync(filepath, { mode: 0o777, recursive: true });
    }

    const stream = createWriteStream(`${filepath}/${filename}`);
    const workbook = new exceljs.stream.xlsx.WorkbookWriter({ stream, useStyles: true });
    const worksheet = workbook.addWorksheet(filename.split('.')[0]);
    let columns: Columns[] = [];

    Object.keys(columndata).forEach((key) => {
        columns.push({ header: columndata[key], key });
    });

    columns.forEach((column) => {
        column.width = column.header.length > 20 ? column.header.length : 20;
    });

    worksheet.columns = columns;

    columns.forEach((_, i) => {
        let cell = excelColumnName(i + 1) + 1;

        worksheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'CCCCCCCC' }
        };

        worksheet.getCell(cell).font = {
            bold: true
        };

        worksheet.getCell(cell).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    let rowNumber: number = 2;

    for (let i in rowdata) {
        if (!isEmpty(rowdata[i]) && (typeof rowdata[i] === 'object' && Object.keys(rowdata[i]).length > 0)) {
            worksheet.addRow(rowdata[i]);

            columns.forEach((_, i) => {
                let cell = excelColumnName(i + 1) + rowNumber;

                worksheet.getCell(cell).border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            rowNumber++;
        }
    };

    await workbook.commit();
    stream.end();

    const filestats = statSync(`${filepath}/${filename}`);

    return {
        filename,
        filepath,
        filesize: filestats.size,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
};

createExcel(data)
    .then(({ filename, filepath, filesize, mimetype }) => {
        parentPort?.postMessage({ success: true, filename, filepath, filesize, mimetype });
    })
    .catch((err) => {
        parentPort?.postMessage({ success: false, error: err.message });
    });