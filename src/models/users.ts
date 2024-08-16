import moment from "moment-timezone";
import config from "./../config";
import * as dbQuery from "./../helpers/db_query";
import { isEmpty, isNumeric } from "./../helpers/value";

const { timezone } = config;
const table = 'users';

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
        like: ['answer']
    };

    let customConditions: string[] = [];

    if (!isEmpty(conditions?.start) && isNumeric(conditions.start)) {
        let start: string = moment(conditions.start * 1000).format('YYYY-MM-DD');
        let end: string = start;

        if (!isEmpty(conditions?.end) && isNumeric(conditions.end)) {
            end = moment(conditions.end * 1000).format('YYYY-MM-DD');
            delete conditions.end;
        }

        customConditions.push(`DATE(${table}.created) BETWEEN '${start}' AND '${end}'`);
        delete conditions.start;
    }

    let customColumns: string[] = [
        `IFNULL(created_users.fullname, created_users.username) AS created_user`,
        `IFNULL(updated_users.fullname, updated_users.username) AS updated_user`,
    ];

    let join: string[] = [
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

    let columnDeselect: string[] = [];

    if (isEmpty(conditions?.is_auth) || parseInt(conditions?.is_auth) !== 1) {
        columnDeselect.push('password');
        delete conditions.is_auth;
    }

    const groupBy = [`${table}.id`];

    return await dbQuery.getAll({ table, conditions, conditionTypes, customConditions, customColumns, join, columnDeselect, groupBy });
};

export const getDetail = async (conditions: Conditions) => {
    const customColumns: string[] = [
        `IFNULL(created_users.fullname, created_users.username) AS created_user`,
        `IFNULL(updated_users.fullname, updated_users.username) AS updated_user`,
    ];

    const join: string[] = [
        `LEFT JOIN users AS created_users ON created_users.id = ${table}.created_by`,
        `LEFT JOIN users AS updated_users ON updated_users.id = ${table}.updated_by`,
    ];

    let columnDeselect: string[] = [];

    if (isEmpty(conditions?.is_auth) || parseInt(conditions?.is_auth) !== 1) {
        columnDeselect.push('password');
        delete conditions.is_auth;
    }

    return await dbQuery.getDetail({ table, conditions, customColumns, join, columnDeselect });
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