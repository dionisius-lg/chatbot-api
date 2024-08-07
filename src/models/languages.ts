import moment from "moment-timezone";
import config from "./../config";
import * as dbQuery from "./../helpers/db_query";
import { isEmpty } from "./../helpers/value";

const { timezone } = config;
const table = 'languages';

moment.tz.setDefault(timezone);

interface Conditions {
    [key: string]: any;
}
interface Data {
    [key: string]: any;
}

export const getAll = async (conditions: Conditions) => {
    const conditionTypes = {
        date: ['created', 'updated'],
        like: ['name', 'native_name']
    };

    let customConditions: string[] = [];

    if (!isEmpty(conditions?.start) && typeof conditions.start === 'number') {
        let start: string = moment(conditions.start * 1000).format('YYYY-MM-DD');
        let end: string = start;

        if (!isEmpty(conditions?.end) && typeof conditions.end === 'number') {
            end = moment(conditions.end * 1000).format('YYYY-MM-DD');
            delete conditions.end;
        }

        customConditions.push(`DATE(${table}.created) BETWEEN '${start}' AND '${end}'`);
        delete conditions.start;
    }

    let customColumns: string[] = [];

    let join: string[] = [];

    if (!isEmpty(conditions?.is_export) && parseInt(conditions.is_export) === 1) {
        customColumns.push(`@no := @no + 1 AS no`);
        join.push(`CROSS JOIN (SELECT @no := 0) n`);
    }

    const groupBy = [`${table}.id`];

    return await dbQuery.getAll({ table, conditions, conditionTypes, customConditions, customColumns, join, groupBy });
};

export const getDetail = async (conditions: Conditions) => {
    return await dbQuery.getDetail({ table, conditions });
};

export const insertData = async (data: Data) => {
    const protectedColumns = ['id'];
    return await dbQuery.insertData({ table, data, protectedColumns });
};

export const insertManyData = async (data: Data[]) => {
    const protectedColumns = ['id']
    return await dbQuery.insertManyData({ table, data, protectedColumns });
};

export const insertUpdateData = async (data: Data[]) => {
    return await dbQuery.insertDuplicateUpdateData({ table, data });
};

export const updateData = async (data: Data, conditions: Conditions) => {
    const protectedColumns = ['id'];
    return await dbQuery.updateData({ table, data, conditions, protectedColumns });
};

export const deleteData = async (conditions: Conditions) => {
    return await dbQuery.deleteData({ table, conditions });
};