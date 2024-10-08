import moment, { Moment } from "moment-timezone";
import * as _ from "lodash";
import config from "./../config";
import pool, { escape, QueryError, RowDataPacket, ResultSetHeader } from "./../config/pool";
import { getDataQuery, setDataQuery, deleteDataQuery } from "./chache";
import { filterColumn, filterData } from "./request";
import { isEmpty, isNumeric } from "./value";

const { timezone, database, cache } = config;

moment.tz.setDefault(timezone);

interface ConditionTypes {
    like?: string[];
    date?: string[];
}

interface ResultData {
    total_data: number;
    limit?: number;
    page?: number;
}

interface ResultDataArray extends ResultData {
    data: Record<string, any>[] | false;
}

interface ResultDataObject extends ResultData {
    data: Record<string, any> | false;
}

interface CheckColumnOptions {
    dbname?: string;
    table: string;
}

export const checkColumn = ({
    table
}: CheckColumnOptions): Promise<string[]> => {
    return new Promise((resolve) => {
        const query: string = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${database.name}' AND TABLE_NAME = '${table}'`;

        pool.query(query, (err: QueryError | null, result?: RowDataPacket[] | undefined) => {
            if (err) {
                console.error(err);
                return resolve([]);
            }

            if (!result || isEmpty(result)) {
                return resolve([]);
            }

            const columns: string[] = result.map((row) => row.COLUMN_NAME);

            return resolve(columns);
        });
    });
};

interface CheckCustomFieldOptions {
    table: string;
}

export const checkCustomField = ({
    table
}: CheckCustomFieldOptions): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const query: string = `SELECT * FROM custom_fields WHERE is_active = 1 AND source_table = '${table}'`;

        pool.query(query, (err: QueryError | null, result?: RowDataPacket[] | undefined) => {
            if (err) {
                console.error(err);
                return resolve([]);
            }

            if (!result || isEmpty(result)) {
                return resolve([]);
            }

            const columns = result.map((row) => ({
                field_key: row.field_key,
                field_type_id: row.field_type_id
            }));

            return resolve(columns);
        });
    });
};

interface CountDataOptions {
    table: string;
    conditions?: Record<string, any>;
    conditionTypes?: ConditionTypes;
    customConditions?: string[];
    attributeColumn?: string;
    customFields?: string[];
    customDropdownFields?: string[];
    customAttributes?: Record<string, any>;
    join?: string[];
    groupBy?: string[];
    having?: string[];
}

export const countData = ({
    table,
    conditions,
    conditionTypes,
    customConditions,
    attributeColumn,
    customFields,
    customDropdownFields,
    customAttributes,
    join,
    groupBy,
    having
}: CountDataOptions) => {
    return new Promise<number>((resolve) => {
        let setCond: string[] = [];
        let setCustomCond: string[] = [];
        let queryCond: string = '';
        let query: string = `SELECT COUNT(*) AS count FROM ${table}`;
        let queryCount: string = '';

        if (join && !isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery: string = join.join(' ');
            query += ` ${joinQuery}`;
        }

        if (conditions && !isEmpty(conditions)) {
            Object.keys(conditions).forEach((k) => {
                if (conditionTypes && !isEmpty(conditionTypes)) {
                    switch (true) {
                        case (conditionTypes.date && (conditionTypes.date).includes(k)):
                            let dateVal: Moment = _.toNumber(conditions[k]) > 0 ? moment(_.toNumber(conditions[k]) * 1000) : moment(new Date());
                            setCond.push(`DATE(${table}.${k}) = ${escape(dateVal.format('YYYY-MM-DD'))}`);
                            break;
                        case (conditionTypes.like && (conditionTypes.like).includes(k)):
                            let likeVal = `%${conditions[k]}%`;
                            setCond.push(`${table}.${k} LIKE ${escape(likeVal)}`);
                            break;
                        default:
                            if (conditions[k].constructor === Array) {
                                setCond.push(`${table}.${k} IN (${escape(conditions[k])})`);
                            } else {
                                setCond.push(`${table}.${k} = ${escape(conditions[k])}`);
                            }
                            break;
                    }
                } else {
                    if (conditions[k].constructor === Array) {
                        setCond.push(`${table}.${k} IN (${escape(conditions[k])})`);
                    } else {
                        setCond.push(`${table}.${k} = ${escape(conditions[k])}`);
                    }
                }
            });


            queryCond = setCond.join(' AND ');
            query += ` WHERE ${queryCond}`;
        }

        if (attributeColumn && !isEmpty(attributeColumn)) {
            // for custom attributes
            let queryLine: string;

            if (customAttributes && !isEmpty(customAttributes)) {
                for (let k in customAttributes) {
                    switch (true) {
                        case (customDropdownFields && customDropdownFields.includes(k)):
                            queryLine = `JSON_EXTRACT(${table}.${attributeColumn}, '$.${k}.id') = ${escape(customAttributes[k])}`;
                            break;
                        default:
                            queryLine = `JSON_EXTRACT(LOWER(${table}.${attributeColumn}), '$.${k}') = LOWER(${escape(customAttributes[k])})`;
                            break;
                    }

                    setCustomCond.push(queryLine);
                }

                queryCond = setCustomCond.join((' AND '));
                query += (conditions && !isEmpty(conditions)) ? ` AND ${queryCond}` : ` WHERE ${queryCond}`;
            }
        }

        if (customConditions && !isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ` WHERE ` + customConditions.join(' AND ');

            if ((conditions && !isEmpty(conditions)) || (setCustomCond && !isEmpty(setCustomCond))) {
                queryCond = ` AND ` + customConditions.join(' AND ');
            }

            query += `${queryCond}`;
        }

        if (groupBy && !isEmpty(groupBy) && _.isArrayLikeObject(groupBy)) {
            let columnGroup = groupBy.join(', ');
            query += ` GROUP BY ${columnGroup}`;

            if (having && !isEmpty(having) && _.isArrayLikeObject(having)) {
                let havingClause = having.join(' AND ');
                query += ` HAVING ${havingClause}`;
            }

            queryCount = `SELECT COUNT(*) AS count FROM (${query}) AS count`;
            query = queryCount;
        }

        pool.query(query, (err: QueryError | null, result?: RowDataPacket[] | undefined) => {
            if (err) {
                console.error(err);
                return resolve(0);
            }

            if (!result || isEmpty(result)) {
                return resolve(0);
            }

            const { count } = result[0];
            
            return resolve(count || 0);
        });
    });
};

interface GetAllOptions {
    table: string;
    conditions?: Record<string, any>;
    conditionTypes?: ConditionTypes;
    customConditions?: string[];
    columnSelect?: string[];
    columnDeselect?: string[];
    customColumns?: string[];
    attributeColumn?: string;
    join?: string[];
    groupBy?: string[];
    customOrders?: string[];
    having?: string[];
    cacheKey?: string;
}

export const getAll = ({
    table,
    conditions,
    conditionTypes,
    customConditions,
    columnSelect,
    columnDeselect,
    customColumns,
    attributeColumn,
    join,
    groupBy,
    customOrders,
    having,
    cacheKey
}: GetAllOptions): Promise<ResultDataArray> => {
    return new Promise(async (resolve) => {
        let resultData: ResultDataArray = {
            total_data: 0,
            data: false
        };

        let columns: string[] = await checkColumn({ table });
        const masterColumns = columns;
        let column: string = '';
        const customAttributes = conditions ? { ... conditions } : {};
        const sortData: string[] = ['ASC', 'DESC'];

        let order: boolean | string = conditions && conditions?.order || columns[0];
            order = typeof order === 'string' && columns.includes(order) ? order : columns[0];

        if (typeof conditions?.order === 'boolean' && conditions?.order === false) {
            order = false;
        }

        let sort: string = sortData[0];

        if (conditions && typeof conditions?.sort === 'string' && sortData.includes((conditions?.sort).toUpperCase())) {
            sort = (conditions.sort).toUpperCase();
        }

        let limit: number = 20;

        if (conditions && isNumeric(conditions?.limit) && conditions?.limit >= 0) {
            limit = conditions.limit;
        }

        let page: number = conditions && _.toNumber(conditions?.page) || 1;
        let setCond: string[] = [];
        let queryCond: string = '';
        let getCustomFields: any[] = [];
        let customFields: string[] = [];
        let customDropdownFields: string[] = [];

        if (attributeColumn && !isEmpty(attributeColumn)) {
            getCustomFields = await checkCustomField({ table });
            customFields = _.map(getCustomFields, 'field_key');
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 });
            customDropdownFields = _.map(getDropdownColumn, 'field_key');
            filterColumn(customAttributes, customFields);
        }

        if (columnSelect && !isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            let validColumn = _.intersection(columnSelect, columns);
            columns = validColumn;
        }

        if (columnDeselect && !isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            if (columnDeselect.includes('*')) {
                // filter data, exclude all columns
                // let selectedColumn = _.difference(columns, deselectedColumn)
                columns = [];
            } else {
                // filter data, get column to exclude from valid selected columns or table columns
                let deselectedColumn = _.intersection(columnDeselect, columns);
                // filter data, exclude deselected columns
                let selectedColumn = _.difference(columns, deselectedColumn);
                columns = selectedColumn;
            }
        }

        if (join && !isEmpty(join) && _.isArrayLikeObject(join)) {
            // give prefix table to table columns
            let prefixColumn = columns.map((col: string) => {
                return `${table}.${col}`;
            });

            columns = prefixColumn;
        }

        column = columns.join(', ');

        if (attributeColumn && customFields && !isEmpty(customFields)) {
            let customField: string = '';
            let setCustomField: string[] = [];

            for (let i in customFields) {
                if (customDropdownFields && customDropdownFields.includes(customField[i])) {
                    setCustomField.push(`CONCAT_WS('||', JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[i]}.id')), JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[i]}.value'))) AS ${customFields[i]}`);
                } else {
                    setCustomField.push(`JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[i]}')) AS ${customFields[i]}`);
                }
            }

            customField = setCustomField.join(', ');
            column += (!isEmpty(column)) ? `, ${customField}` : `${customField}`;
        }

        if (customColumns && !isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            if (isEmpty(columns)) {
                column += customColumns.join(', ');
            } else {
                column += ', ' + customColumns.join(', ');
            }
        }

        let query: string = `SELECT ${column} FROM ${table}`;

        if (join && !isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery: string = join.join(' ');
            query += ` ${joinQuery}`;
        }

        // remove invalid column from conditions
        filterColumn(conditions, masterColumns);

        if (conditions && !isEmpty(conditions)) {
            Object.keys(conditions).forEach((k) => {
                if (conditionTypes && !isEmpty(conditionTypes)) {
                    switch (true) {
                        case (conditionTypes.date && (conditionTypes.date).includes(k)):
                            let dateVal: Moment = _.toNumber(conditions[k]) > 0 ? moment(_.toNumber(conditions[k]) * 1000) : moment(new Date());
                            setCond.push(`DATE(${table}.${k}) = ${escape(dateVal.format('YYYY-MM-DD'))}`);
                            break;
                        case (conditionTypes.like && (conditionTypes.like).includes(k)):
                            let likeVal = `%${conditions[k]}%`;
                            setCond.push(`${table}.${k} LIKE ${escape(likeVal)}`);
                            break;
                        default:
                            if (conditions[k].constructor === Array) {
                                setCond.push(`${table}.${k} IN (${escape(conditions[k])})`);
                            } else {
                                setCond.push(`${table}.${k} = ${escape(conditions[k])}`);
                            }
                            break;
                    }
                } else {
                    if (conditions[k].constructor === Array) {
                        setCond.push(`${table}.${k} IN (${escape(conditions[k])})`);
                    } else {
                        setCond.push(`${table}.${k} = ${escape(conditions[k])}`);
                    }
                }
            });
        }

        if (attributeColumn && !isEmpty(attributeColumn)) {
            // for custom attributes
            let queryLine: string;

            if (customAttributes && !isEmpty(customAttributes)) {
                for (let k in customAttributes) {
                    switch (true) {
                        case (customDropdownFields && customDropdownFields.includes(k)):
                            queryLine = `JSON_EXTRACT(${table}.${attributeColumn}, '$.${k}.id') = ${escape(customAttributes[k])}`;
                            break;
                        default:
                            queryLine = `JSON_EXTRACT(LOWER(${table}.${attributeColumn}), '$.${k}') = LOWER(${escape(customAttributes[k])})`;
                            break;
                    }

                    setCond.push(queryLine);
                }
            }
        }

        queryCond = setCond.join(' AND ');
        query += !isEmpty(queryCond) ? ` WHERE ${queryCond}` : '';

        if (customConditions && !isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ' WHERE ' + customConditions.join(' AND ');

            if ((conditions && !isEmpty(conditions)) || (setCond && !isEmpty(setCond))) {
                queryCond = ' AND ' + customConditions.join(' AND ');
            }

            query += `${queryCond}`;
        }

        if (groupBy && !isEmpty(groupBy) && _.isArrayLikeObject(groupBy)) {
            let columnGroup: string = groupBy.join(', ');
            query += ` GROUP BY ${columnGroup}`;

            if (having && !isEmpty(having) && _.isArrayLikeObject(having)) {
                let havingClause: string = having.join(' AND ');
                query += ` HAVING ${havingClause}`;
            }
        }

        if (customOrders && !isEmpty(customOrders) && _.isArrayLikeObject(customOrders)) {
            query += ` ORDER BY ${customOrders}`;
        } else {
            if (order && typeof order === 'string' && !isEmpty(order)) {
                let orderColumn: string = order;

                if (join && !isEmpty(join) && _.isArrayLikeObject(join)) {
                    orderColumn = `${table}.${order}`;
                }

                query += ` ORDER BY ${orderColumn} ${sort}`;
            }
        }

        if (limit > 0) {
            const offset: number = (limit * page) - limit;

            if (_.isInteger(offset) && offset >= 0) {
                query += ` LIMIT ${limit} OFFSET ${offset}`;
            } else {
                query += ` LIMIT ${limit}`;
            }
        }

        let count: number = await countData({
            table,
            conditions,
            conditionTypes,
            customConditions,
            attributeColumn,
            customFields,
            customDropdownFields,
            customAttributes,
            join,
            groupBy,
            having
        });

        if (cache.service === 1) {
            const key: string = cacheKey || `${table}:all`;
            const getCache = await getDataQuery({ key, field: query });

            if (getCache) {
                // get data from cache
                return resolve(getCache);
            }
        }

        pool.query(query, (err: QueryError | null, result?: RowDataPacket[] | undefined) => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || isEmpty(result)) {
                return resolve(resultData);
            }

            resultData.total_data = count;
            resultData.data = result;
            resultData.limit = limit;
            resultData.page = page;

            if (cache.service === 1) {
                setDataQuery({ key: `${table}:all`, field: query, value: resultData });
            }

            return resolve(resultData);
        });
    });
};

interface GetDetailOptions {
    table: string | boolean;
    conditions?: Record<string, any>;
    customConditions?: string[];
    columnSelect?: string[];
    columnDeselect?: string[];
    customColumns?: string[];
    attributeColumn?: string;
    join?: string[];
    cacheKey?: string;
}

export const getDetail = ({
    table,
    conditions,
    customConditions,
    columnSelect,
    columnDeselect,
    customColumns,
    attributeColumn,
    join,
    cacheKey
}: GetDetailOptions): Promise<ResultDataObject> => {
    return new Promise(async (resolve) => {
        let resultData: ResultDataObject = {
            total_data: 0,
            data: false
        };

        let columns: string[] = [];
        let masterColumns: string[] = [];

        if (typeof table === 'string' && !isEmpty(table)) {
            columns = await checkColumn({ table });
            masterColumns = columns;
        }

        let column: string = '';
        const customAttributes = conditions ? { ... conditions } : {};

        let setCond: string[] = [];
        let queryCond:  string = '';
        let getCustomFields: any[] = [];
        let customFields: string[] = [];
        let customDropdownFields: string[] = [];

        if (attributeColumn && !isEmpty(attributeColumn)) {
            if (typeof table === 'string' && !isEmpty(table)) {
                getCustomFields = await checkCustomField({ table });
            }

            customFields = _.map(getCustomFields, 'field_key');
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 });
            customDropdownFields = _.map(getDropdownColumn, 'field_key');
            filterColumn(customAttributes, customFields);
        }

        if (columnSelect && !isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            let validColumn = _.intersection(columnSelect, columns);
            columns = validColumn;
        }

        if (columnDeselect && !isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            if (columnDeselect.includes('*')) {
                // filter data, exclude all columns
                // let selectedColumn = _.difference(columns, deselectedColumn)
                columns = [];
            } else {
                // filter data, get column to exclude from valid selected columns or table columns
                let deselectedColumn = _.intersection(columnDeselect, columns);
                // filter data, exclude deselected columns
                let selectedColumn = _.difference(columns, deselectedColumn);
                columns = selectedColumn;
            }
        }

        if (join && !isEmpty(join) && _.isArrayLikeObject(join)) {
            // give prefix table to table columns
            let prefixColumn = columns.map((col: string) => {
                return `${table}.${col}`;
            });

            columns = prefixColumn;
        }

        column = columns.join(', ');

        if (attributeColumn && customFields && !isEmpty(customFields)) {
            let customField: string = '';
            let setCustomField: string[] = [];

            for (let i in customFields) {
                if (customDropdownFields && customDropdownFields.includes(customField[i])) {
                    setCustomField.push(`CONCAT_WS('||', JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[i]}.id')), JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[i]}.value'))) AS ${customFields[i]}`);
                } else {
                    setCustomField.push(`JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[i]}')) AS ${customFields[i]}`);
                }
            }

            customField = setCustomField.join(', ');
            column += (!isEmpty(column)) ? `, ${customField}` : `${customField}`;
        }

        if (customColumns && !isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            if (isEmpty(columns)) {
                column += customColumns.join(', ');
            } else {
                column += ', ' + customColumns.join(', ');
            }
        }

        if (customColumns && !isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            let append: string = '';

            if (column && !isEmpty(column)) {
                append = ', ';
            }

            column += append + customColumns.join(', ');
        }

        let query: string = `SELECT ${column}`

        if (typeof table === 'string' && !isEmpty(table)) {
            query += ` FROM ${table}`;
        }

        if (join && !isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery: string = join.join(' ');
            query += ` ${joinQuery}`;
        }

        if (masterColumns && !isEmpty(masterColumns)) {
            // remove invalid column from conditions
            filterColumn(conditions, masterColumns);
        }

        if (conditions && !isEmpty(conditions)) {
            Object.keys(conditions).forEach((k: string) => {
                let kCond: string = k;

                if (typeof table === 'string' && !isEmpty(table) && join && !isEmpty(join) && _.isArrayLikeObject(join)) {
                    kCond = `${table}.${k}`;
                }

                setCond.push(`${kCond} = ${escape(conditions[k])}`);
            });

            queryCond = setCond.join(' AND ');
            query += ` WHERE ${queryCond}`;
        }

        if (customConditions && !isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ' WHERE ' + customConditions.join(' AND ');

            if ((conditions && !isEmpty(conditions))) {
                queryCond = ' AND ' + customConditions.join(' AND ');
            }

            query += `${queryCond}`;
        }

        if (typeof table === 'string' && !isEmpty(table)) {
            query += ` LIMIT 1`;

            if (cache.service === 1) {
                const key: string = cacheKey || table;
                const keyId: string = conditions && conditions?.id || '';
                const getCache = await getDataQuery({ key: `${key}${keyId}`, field: query });
    
                if (getCache) {
                    // get data from cache
                    return resolve(getCache);
                }
            }
        }

        
        pool.query(query, (err: QueryError | null, result?: RowDataPacket[] | undefined) => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || isEmpty(result)) {
                return resolve(resultData);
            }

            resultData.total_data = 1;
            resultData.data = result[0];
            resultData.limit = 1;
            resultData.page = 0;

            if (typeof table === 'string' && !isEmpty(table) && cache.service === 1) {
                const key: string = cacheKey || table;
                const keyId: string = conditions && conditions?.id || '';
                setDataQuery({ key: `${key}${keyId}`, field: query, value: resultData });
            }

            return resolve(resultData);
        });
    });
};

interface InsertDataOptions {
    table: string;
    data: Record<string, any>;
    attributeColumn?: string;
    protectedColumns?: string[];
    cacheKeys?: string[];
}

export const insertData = ({
    table,
    data,
    attributeColumn,
    protectedColumns,
    cacheKeys
}: InsertDataOptions): Promise<ResultDataObject> => {
    return new Promise(async (resolve) => {
        let resultData: ResultDataObject = {
            total_data: 0,
            data: false
        };
    
        let timeChar: string[] = ['CURRENT_TIMESTAMP()', 'NOW()'];
        let nullChar: string[] = ['NULL', ''];

        const dataCustom: { [key: string]: any } = { ... data };
        const columns: string[] = await checkColumn({ table });

        // remove invalid column from data
        filterColumn(data, columns);
        // remove invalid data
        filterData(data);

        let getCustomFields: any[] = [];
        let customFields: string[] = [];
        let customDropdownFields: string[] = [];

        let keys: string[] = Object.keys(data);

        // check protected columns on submitted data
        let forbiddenColumns: string[] = _.intersection(protectedColumns, keys);

        if (!isEmpty(forbiddenColumns)) {
            return resolve(resultData);
        }

        if (attributeColumn && !isEmpty(attributeColumn)) {
            getCustomFields = await checkCustomField({ table });
            customFields = _.map(getCustomFields, 'field_key');
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 });
            customDropdownFields = _.map(getDropdownColumn, 'field_key');
            filterColumn(dataCustom, customFields);
        }

        let column: string = keys.join(', ');

        let query: string = `INSERT INTO ${table} (${column}) VALUES ?`;
        // let values: string[] = [];
        let values: (string | number | null)[][] = [];
        let dataCustomField: Record<string, any> = {};

        let tempVal = Object.keys(data).map(k => {
            let dataVal: string | number | null = null;

            if (typeof data[k] !== undefined) {
                dataVal = data[k];

                if (typeof dataVal === 'string') {
                    dataVal = dataVal.trim();

                    if (typeof dataVal === 'string' && timeChar.includes(dataVal.toUpperCase())) {
                        dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    }
        
                    if (typeof dataVal === 'string' && nullChar.includes(dataVal.toUpperCase())) {
                        dataVal = null;
                    }
                }
            }

            return dataVal;
        });

        Object.keys(dataCustom).forEach((k) => {
            if (customFields && customFields.includes(k)) {
                dataCustomField[k] = dataCustom[k];

                if (customDropdownFields && customDropdownFields.includes(k)) {
                    let dropdownData: string[] = dataCustom[k].split('||');
                    let dropdownId: string | number = dropdownData[0] || '';
                    let dropdownValue: string = dropdownData[1] || '';

                    if (_.isNumber(dropdownId) && parseInt(dropdownId) > 0 && !isEmpty(dropdownValue)) {
                        dataCustomField[k] = {id: dropdownId, value: dropdownValue}
                    }
                }
            }
        });

        let jsonDataCustom: string = JSON.stringify(dataCustomField);

        if (!isEmpty(dataCustomField)) {
            tempVal.push(jsonDataCustom);
        }

        values.push(tempVal);

        pool.query(query, [values], (err: QueryError | null, result: ResultSetHeader): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || isEmpty(result)) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;

                switch (true) {
                    case (cacheKeys && !isEmpty(cacheKeys)):
                        cacheKeys.push(keyData);
                        deleteDataQuery({ key: cacheKeys });
                        break;
                    default:
                        deleteDataQuery({ key: [keyData] });
                        break;
                }
            }

            resultData.total_data = result.affectedRows;
            resultData.data = { id: result.insertId };

            return resolve(resultData);
        });
    });
};

interface InsertManyDataOptions {
    table: string;
    data: Record<string, any>[];
    protectedColumns?: string[];
    cacheKeys?: string[];
}

export const insertManyData = ({
    table,
    data,
    protectedColumns,
    cacheKeys
}: InsertManyDataOptions): Promise<ResultDataArray> => {
    return new Promise(async (resolve) => {
        let resultData: ResultDataArray = {
            total_data: 0,
            data: false
        };

        let timeChar: string[] = ['CURRENT_TIMESTAMP()', 'NOW()'];
        let nullChar: string[] = ['NULL'];

        if (isEmpty(data) || data.length === 0) {
            return resolve(resultData);
        }

        // get table columns
        const columns: string[] = await checkColumn({ table });
        // compare fields from data with columns
        const diff: string[] = _.difference(Object.keys(data[0]), columns);

        // if there are invalid fields/columns
        if (!isEmpty(diff)) {
            return resolve(resultData);
        }

        // remove invalid data
        filterData(data[0]);

        const keys: string[] = Object.keys(data[0]);

        // if key data empty
        if (isEmpty(keys)) {
            return resolve(resultData);
        }

        // check protected columns on submitted data
        const forbiddenColumns: string[] = _.intersection(protectedColumns, keys);

        if (!isEmpty(forbiddenColumns)) {
            return resolve(resultData);
        }

        const column: string = keys.join(', ');

        let query: string = `INSERT INTO ${table} (${column}) VALUES ?`;
        let values: (string | number | null)[][] = [];
        let tempVal: (string | number | null)[] = [];

        for (let i in data) {
            // if index and 'data order' on each object not the same
            if (!_.isEqual(keys, Object.keys(data[i]))) {
                return resolve(resultData);
            }

            tempVal = Object.keys(data[i]).map(k => {
                let dataVal: string | number | null = null;

                if (typeof data[i][k] !== undefined) {
                    dataVal = data[i][k];

                    if (typeof dataVal === 'string') {
                        dataVal = dataVal.trim();

                        if (typeof dataVal === 'string' && timeChar.includes(dataVal.toUpperCase())) {
                            dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                        }

                        if (typeof dataVal === 'string' && nullChar.includes(dataVal.toUpperCase())) {
                            dataVal = null;
                        }
                    }
                }

                return dataVal;
            });

            values.push(tempVal);
        }

        pool.query(query, [values], (err: QueryError | null, result: ResultSetHeader): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || isEmpty(result)) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;

                switch (true) {
                    case (cacheKeys && !isEmpty(cacheKeys)):
                        cacheKeys.push(keyData);
                        deleteDataQuery({ key: cacheKeys });
                        break;
                    default:
                        deleteDataQuery({ key: [keyData] });
                        break;
                }
            }

            resultData.total_data = result.affectedRows;
            resultData.data = data;

            return resolve(resultData);
        });
    });
};

interface InsertDuplicateUpdateDataOptions {
    table: string;
    data: Record<string, any>[];
    protectedColumns?: string[];
    cacheKeys?: string[];
}

export const insertDuplicateUpdateData = ({
    table,
    data,
    protectedColumns,
    cacheKeys
}: InsertDuplicateUpdateDataOptions): Promise<ResultDataArray> => {
    return new Promise(async (resolve) => {
        let resultData: ResultDataArray = {
            total_data: 0,
            data: false
        };

        let timeChar: string[] = ['CURRENT_TIMESTAMP()', 'NOW()'];
        let nullChar: string[] = ['NULL'];

        if (isEmpty(data) || data.length === 0) {
            return resolve(resultData);
        }

        // get table columns
        const columns: string[] = await checkColumn({ table });
        // compare fields from data with columns
        const diff: string[] = _.difference(Object.keys(data[0]), columns);

        // if there are invalid fields/columns
        if (!isEmpty(diff)) {
            return resolve(resultData);
        }

        // remove invalid data
        filterData(data[0]);

        const keys: string[] = Object.keys(data[0]);

        // if key data empty
        if (isEmpty(keys)) {
            return resolve(resultData);
        }

        // check protected columns on submitted data
        const forbiddenColumns: string[] = _.intersection(protectedColumns, keys);

        if (!isEmpty(forbiddenColumns)) {
            return resolve(resultData);
        }

        const column: string = keys.join(', ');
        let update: string[] = [];

        keys.forEach(v => {
            update.push(`${v} = VALUES(${v})`);
        })

        const updateDuplicate: string = update.join(', ');

        let query: string = `INSERT INTO ${table} (${column}) VALUES ? ON DUPLICATE KEY UPDATE ${updateDuplicate}`;
        let values: (string | number | null)[][] = [];
        let tempVal: (string | number | null)[] = [];

        for (let i in data) {
            // if index and 'data order' on each object not the same
            if (!_.isEqual(keys, Object.keys(data[i]))) {
                return resolve(resultData);
            }

            tempVal = Object.keys(data[i]).map(k => {
                let dataVal: string | number | null = null;

                if (typeof data[i][k] !== undefined) {
                    dataVal = data[i][k];

                    if (typeof dataVal === 'string') {
                        dataVal = dataVal.trim();

                        if (typeof dataVal === 'string' && timeChar.includes(dataVal.toUpperCase())) {
                            dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                        }

                        if (typeof dataVal === 'string' && nullChar.includes(dataVal.toUpperCase())) {
                            dataVal = null;
                        }
                    }
                }

                return dataVal;
            });

            values.push(tempVal);
        }

        pool.query(query, [values], (err: QueryError | null, result: ResultSetHeader): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || isEmpty(result)) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;

                switch (true) {
                    case (cacheKeys && !isEmpty(cacheKeys)):
                        cacheKeys.push(keyData);
                        deleteDataQuery({ key: cacheKeys });
                        break;
                    default:
                        deleteDataQuery({ key: [keyData] });
                        break;
                }
            }

            resultData.total_data = result.affectedRows;
            resultData.data = data;

            return resolve(resultData);
        });
    });
};

interface UpdateDataOptions {
    table: string;
    data: Record<string, any>;
    conditions: Record<string, any>;
    attributeColumn?: string;
    protectedColumns?: string[];
    cacheKeys?: string[];
}

export const updateData = ({
    table,
    data,
    conditions,
    attributeColumn,
    protectedColumns,
    cacheKeys
}: UpdateDataOptions): Promise<ResultDataObject> => {
    return new Promise(async (resolve) => {
        let resultData: ResultDataObject = {
            total_data: 0,
            data: false
        };

        let timeChar: string[] = ['CURRENT_TIMESTAMP()', 'NOW()'];
        let nullChar: string[] = ['NULL'];
        let setData: string[] = [];
        let queryData: string = '';
        let setCond: string[] = [];
        let queryCond: string = '';
        let query: string = `UPDATE ${table}`;

        const dataCustom: { [key: string]: any } = { ... data };
        const customAttributes: { [key: string]: any } = { ... conditions };
        const columns: string[] = await checkColumn({ table });

        // remove invalid column from data
        filterColumn(data, columns);
        // remove invalid data
        filterData(data);

        let customFields: string[] = [];
        let getCustomFields: any[] = [];
        let customDropdownFields: string[] = [];

        if (attributeColumn && !isEmpty(attributeColumn)) {
            getCustomFields = await checkCustomField({ table });
            customFields = _.map(getCustomFields, 'field_key');
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 });
            customDropdownFields = _.map(getDropdownColumn, 'field_key');
            filterColumn(dataCustom, customFields);
            filterColumn(customAttributes, customFields);
        }

        // reject('Update query is unsafe without data and condition')
        if (isEmpty(data) || isEmpty(dataCustom) || isEmpty(conditions)) {
            return resolve(resultData);
        }

        const keys: string[] = Object.keys(data);
        // check protected columns on submitted data
        const forbiddenColumns = _.intersection(protectedColumns, keys);

        if (!isEmpty(forbiddenColumns)) {
            return resolve(resultData);
        }

        if (attributeColumn && data.hasOwnProperty(attributeColumn)) {
            delete data[attributeColumn];
        }

        keys.forEach(k => {
            let dataVal: string | number | null = null;

            if (typeof data[k] !== undefined) {
                dataVal = data[k];

                if (typeof dataVal === 'string') {
                    dataVal = dataVal.trim();

                    if (typeof dataVal === 'string' && timeChar.includes(dataVal.toUpperCase())) {
                        dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    }
        
                    if (typeof dataVal === 'string' && nullChar.includes(dataVal.toUpperCase())) {
                        dataVal = null;
                    }
                }
            }

            if (isEmpty(dataVal) && dataVal !== 0) {
                setData.push(`${k} = NULL`);
            } else {
                setData.push(`${k} = ${escape(dataVal)}`);
            }
        });

        if (attributeColumn && !isEmpty(attributeColumn)) {
            let setJsonData: string[] = [];

            Object.keys(dataCustom).forEach(k => {
                if (customFields.includes(k)) {
                    switch (true) {
                        case (customDropdownFields.includes(k)):
                            let dropdownData: string[] = dataCustom[k].split('||');
                            let dropdownId: string | number = dropdownData[0] || '';
                            let dropdownValue: string = dropdownData[1] || '';

                            if (_.isNumber(dropdownId) && parseInt(dropdownId) > 0 && !isEmpty(dropdownValue)) {
                                setJsonData.push(`'$.${k}', JSON_OBJECT('id', ${escape(parseInt(dropdownId))}, 'value', ${escape(dropdownValue)})`);
                            }
                            break;
                        default:
                            setJsonData.push(`'$.${k}', ${escape(dataCustom[k])}`);
                            break;
                    }
                }
            });

            let joinData: string = setJsonData.join(', ');

            if (!isEmpty(joinData)) {
                setData.push(`${attributeColumn} = JSON_SET(COALESCE(${attributeColumn}, '{}'), ${joinData})`);
            }
        }

        queryData = setData.join(', ');
        query += ` SET ${queryData}`;

        Object.keys(conditions).forEach(k => {
            switch (true) {
                case (_.isArray(conditions[k])):
                    setCond.push(`${k} IN (${(conditions[k].join(',')).trim()})`);
                    break;
                default:
                    setCond.push(`${k} = ${escape(typeof conditions[k] === 'string' && conditions[k].trim() || conditions[k])}`);
                    break;
            }
        });

        if (attributeColumn && !isEmpty(attributeColumn)) {
            for (let k in customAttributes) {
                if (customFields.includes(k)) {
                    setCond.push(`JSON_EXTRACT(LOWER(${attributeColumn}), '$.${k}') = LOWER(${escape(customAttributes[k])})`);
                }
            }
        }

        queryCond = setCond.join(' AND ');
        query += ` WHERE ${queryCond}`;

        pool.query(query, (err: QueryError | null, result: ResultSetHeader): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || isEmpty(result)) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;
                const keyId = conditions['id'] || '';

                switch (true) {
                    case (cacheKeys && !isEmpty(cacheKeys)):
                        cacheKeys.push(keyData);

                        if (keyId) {
                            cacheKeys.push(`${table}:${keyId}`)
                        }

                        deleteDataQuery({ key: cacheKeys });
                        break;
                    default:
                        let keyToDelete = [keyData];

                        if (keyId) {
                            keyToDelete.push(`${table}:${keyId}`)
                        }

                        deleteDataQuery({ key: keyToDelete });
                        break;
                }
            }

            resultData.total_data = result.affectedRows;
            resultData.data = conditions;

            if (resultData.total_data < 1 || result.warningStatus) {
                resultData.data = false;
            }

            return resolve(resultData);
        });
    });
};

interface DeleteDataOptions {
    table: string;
    conditions: Record<string, any>;
    cacheKeys?: string[];
}

export const deleteData = ({
    table,
    conditions,
    cacheKeys
}: DeleteDataOptions): Promise<ResultDataObject> => {
    return new Promise(async (resolve) => {
        let resultData: ResultDataObject = {
            total_data: 0,
            data: false
        };

        let setCond: string[] = [];
        let queryCond: string = '';
        let query: string = `DELETE FROM ${table}`;

        // reject('Delete query is unsafe without condition')
        if (isEmpty(conditions)) {
            return resolve(resultData);
        }

        Object.keys(conditions).forEach(k => {
            switch (true) {
                case (_.isArray(conditions[k])):
                    setCond.push(`${k} IN (${(conditions[k].join(',')).trim()})`);
                    break;
                default:
                    setCond.push(`${k} = ${escape(typeof conditions[k] === 'string' && conditions[k].trim() || conditions[k])}`);
                    break;
            }
        });

        queryCond = setCond.join(' AND ');
        query += ` WHERE ${queryCond}`;

        pool.query(query, (err: QueryError | null, result: ResultSetHeader): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || isEmpty(result)) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;
                const keyId = conditions['id'] || '';

                switch (true) {
                    case (cacheKeys && !isEmpty(cacheKeys)):
                        cacheKeys.push(keyData);

                        if (keyId) {
                            cacheKeys.push(`${table}:${keyId}`)
                        }

                        deleteDataQuery({ key: cacheKeys });
                        break;
                    default:
                        let keyToDelete = [keyData];

                        if (keyId) {
                            keyToDelete.push(`${table}:${keyId}`)
                        }

                        deleteDataQuery({ key: keyToDelete });
                        break;
                }
            }

            resultData.total_data = result.affectedRows;

            if (result.affectedRows > 0) {
                resultData.data = conditions;
            }

            return resolve(resultData);
        });
    })
};