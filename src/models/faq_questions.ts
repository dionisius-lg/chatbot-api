import moment from "moment-timezone";
import config from "./../config";
import * as dbQuery from "./../helpers/db_query";
import { isEmpty } from "./../helpers/value";

const { timezone } = config;
const table = 'faq_questions';

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
        like: ['question']
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

    let customColumns: string[] = [
        `faqs.intent`,
        `languages.name AS language`,
        `languages.native_name AS language_native`,
        `languages.locale AS locale`,
        `IFNULL(created_users.fullname, created_users.username) AS created_user`,
        `IFNULL(updated_users.fullname, updated_users.username) AS updated_user`,
    ];

    let join: string[] = [
        `LEFT JOIN faqs ON faqs.id = ${table}.faq_id`,
        `LEFT JOIN languages ON languages.id = faqs.language_id`,
        `LEFT JOIN users AS created_users ON created_users.id = ${table}.created_by`,
        `LEFT JOIN users AS updated_users ON updated_users.id = ${table}.updated_by`,
    ];

    if (!isEmpty(conditions?.is_export)) {
        if (parseInt(conditions.is_export) === 1) {
            customColumns.push(`@no := @no + 1 AS no`);
            join.push(`CROSS JOIN (SELECT @no := 0) n`);
        }

        delete conditions.is_export;
    }

    const groupBy = [`${table}.id`];

    return await dbQuery.getAll({ table, conditions, conditionTypes, customConditions, customColumns, join, groupBy });
};

export const getDetail = async (conditions: Conditions) => {
    const customColumns: string[] = [
        `faqs.intent`,
        `languages.name AS language`,
        `languages.native_name AS language_native`,
        `languages.locale AS locale`,
        `IFNULL(created_users.fullname, created_users.username) AS created_user`,
        `IFNULL(updated_users.fullname, updated_users.username) AS updated_user`,
    ];

    const join: string[] = [
        `LEFT JOIN faqs ON faqs.id = ${table}.faq_id`,
        `LEFT JOIN languages ON languages.id = faqs.language_id`,
        `LEFT JOIN users AS created_users ON created_users.id = ${table}.created_by`,
        `LEFT JOIN users AS updated_users ON updated_users.id = ${table}.updated_by`,
    ];

    return await dbQuery.getDetail({ table, conditions, customColumns, join });
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