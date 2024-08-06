import moment from "moment-timezone";
import config from "./../config";
import * as dbQuery from "./../helpers/db_query";
import { isEmpty } from "./../helpers/value";

const { timezone } = config;
const table = 'faqs';

moment.tz.setDefault(timezone);

interface Conditions {
    [key: string]: any;
}
interface Data {
    [key: string]: any;
}

export const getAll = async (conditions: Conditions) => {
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

    if (!isEmpty(conditions?.name) && typeof conditions.name === 'string') {
        customConditions.push(`${table}.name LIKE '%${conditions.name}%'`);
        delete conditions.name;
    }

    const customColumns: string[] = [
        `faq_categories.name AS faq_category`,
        `languages.name AS language`,
        `languages.code AS language_code`,
        `languages.native_name AS language_native`,
    ];

    const join: string[] = [
        `LEFT JOIN faq_categories ON faq_categories.is_active = 1 AND faq_categories.id = ${table}.faq_category_id`,
        `LEFT JOIN languages ON languages.is_active = 1 AND languages.id = ${table}.language_id`,
    ];

    if (!isEmpty(conditions?.is_export) && parseInt(conditions.is_export) === 1) {
        customColumns.push(`@no := @no + 1 AS no`);
        join.push(`CROSS JOIN (SELECT @no := 0) n`);
    }

    const groupBy = [`${table}.id`];

    return await dbQuery.getAll({ table, conditions, customConditions, customColumns, join, groupBy });
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