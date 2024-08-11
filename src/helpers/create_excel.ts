import { workerData, parentPort } from "worker_threads";
import exceljs from "exceljs";
import moment from "moment-timezone";
import { existsSync, mkdirSync, createWriteStream, statSync } from "fs";
import config from "./../config";
import { isEmpty, randomString, excelColumnName } from "./value";

const { timezone, file_dir } = config;

moment.tz.setDefault(timezone);

interface WorkerData {
    columndata: Record<string, any>;
    rowdata: Record<string, any>[];
    filename?: string;
    subpath?: string;
}

interface WorksheetColumn {
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

const createExcel = async ({ columndata, rowdata, filename, subpath = '' }: WorkerData): Promise<Result> => {
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

    const ymd: string = moment(new Date()).format('YYYY/MM/DD');
    let filepath: string = `${file_dir}/${ymd}`;

    if (!isEmpty(subpath)) {
        // replace multiple slash to single slash
        subpath = subpath.replace(/\/+/g, '/');
        // remove first & last slash
        subpath = subpath.replace(/^\/|\/$/g, '');
        // change filepath
        filepath = `${file_dir}/${subpath}/${ymd}`;
    }

    if (!existsSync(filepath)) {
        mkdirSync(filepath, { mode: 0o777, recursive: true });
    }

    const stream = createWriteStream(`${filepath}/${filename}`);
    const workbook = new exceljs.stream.xlsx.WorkbookWriter({ stream, useStyles: true });
    const worksheet = workbook.addWorksheet(filename.split('.')[0]);
    let columns: WorksheetColumn[] = [];

    Object.keys(columndata).forEach((key) => {
        let width: number = columndata[key].length > 20 ? columndata[key].length : 20;
        columns.push({ header: columndata[key], key, width });
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

    let rownumber: number = 2;

    rowdata.forEach((row, i) => {
        if (!isEmpty(row) && (typeof row === 'object' && Object.keys(row).length > 0)) {
            worksheet.addRow(row);

            columns.forEach((_, i) => {
                let cell = excelColumnName(i + 1) + rownumber;

                worksheet.getCell(cell).border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            rownumber++;
        }
    });

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

createExcel(workerData)
    .then((result: Result) => {
        parentPort?.postMessage({ success: true, ...result });
    })
    .catch((err) => {
        parentPort?.postMessage({ success: false, error: err.message });
    });