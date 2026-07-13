import moment, { Moment } from 'moment-timezone';
import * as _ from 'lodash';
import config from './../config';
import pool, { escape, QueryResult } from './../config/pool';
import { getDataQuery, setDataQuery, deleteDataQuery } from './cache';
import { filterColumn, filterData } from './request';
import { isEmpty, isNumeric } from './value';

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
        const query: string = `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}'`;

        pool.query(query, (err: Error | null, result?: QueryResult) => {
            if (err) {
                console.error(err);
                return resolve([]);
            }

            if (!result || isEmpty(result.rows)) {
                return resolve([]);
            }

            // PostgreSQL mengembalikan lower-case 'column_name'
            const columns: string[] = result.rows.map((row) => row.column_name);

            return resolve(columns);
        });
    });
};

interface CountDataOptions {
    table: string;
    conditions?: Record<string, any>;
    conditionTypes?: ConditionTypes;
    customConditions?: string[];
    join?: string[];
    groupBy?: string[];
    having?: string[];
}

export const countData = ({
    table,
    conditions,
    conditionTypes,
    customConditions,
    join,
    groupBy,
    having
}: CountDataOptions) => {
    return new Promise<number>((resolve) => {
        let setCond: string[] = [];
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
                            setCond.push(`(${table}.${k})::date = ${escape(dateVal.format('YYYY-MM-DD'))}`);
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

        if (customConditions && !isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ` WHERE ` + customConditions.join(' AND ');

            if ((conditions && !isEmpty(conditions))) {
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

            queryCount = `SELECT COUNT(*) FROM (${query}) AS count`;
            query = queryCount;
        }

        pool.query(query, (err: Error | null, result?: QueryResult) => {
            if (err) {
                console.error(err);
                return resolve(0);
            }

            if (!result || isEmpty(result.rows)) {
                return resolve(0);
            }

            const count = Number(result.rows[0].count);

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

        if (conditions && isNumeric(conditions?.limit)) {
            limit = parseInt(conditions.limit);
        }

        let page: number = conditions && isNumeric(conditions?.page) && parseInt(conditions.page) || 1;
        let setCond: string[] = [];
        let queryCond: string = '';

        if (columnSelect && !isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            let validColumn = _.intersection(columnSelect, columns);
            columns = validColumn;
        }

        if (columnDeselect && !isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            if (columnDeselect.includes('*')) {
                // exclude all columns
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
            let prefixColumn = columns.map((col: string) => `${table}.${col}`);
            columns = prefixColumn;
        }

        column = columns.join(', ');

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
                            setCond.push(`(${table}.${k})::date = ${escape(dateVal.format('YYYY-MM-DD'))}`);
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
            join,
            groupBy,
            having
        });

        if (cache.service === 1) {
            const key: string = cacheKey || `${table}:all`;
            const getCache = await getDataQuery(key, query);

            if (getCache) {
                return resolve(getCache);
            }
        }

        pool.query(query, (err: Error | null, result?: QueryResult) => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || isEmpty(result.rows)) {
                return resolve(resultData);
            }

            resultData.total_data = count;
            resultData.data = result.rows;
            resultData.limit = limit;
            resultData.page = page;

            if (cache.service === 1) {
                setDataQuery(`${table}:all`, query, resultData);
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
        let setCond: string[] = [];
        let queryCond: string = '';

        if (columnSelect && !isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            let validColumn = _.intersection(columnSelect, columns);
            columns = validColumn;
        }

        if (columnDeselect && !isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            if (columnDeselect.includes('*')) {
                // exclude all columns
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
            let prefixColumn = columns.map((col: string) => `${table}.${col}`);
            columns = prefixColumn;
        }

        column = columns.join(', ');

        if (customColumns && !isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            let append: string = '';

            if (column && !isEmpty(column)) {
                append = ', ';
            }

            column += append + customColumns.join(', ');
        }

        let query: string = `SELECT ${column}`;

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
                const getCache = await getDataQuery(`${key}${keyId}`, query);

                if (getCache) {
                    return resolve(getCache);
                }
            }
        }

        pool.query(query, (err: Error | null, result?: QueryResult) => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || isEmpty(result.rows)) {
                return resolve(resultData);
            }

            resultData.total_data = 1;
            resultData.data = result.rows[0];
            resultData.limit = 1;
            resultData.page = 0;

            if (typeof table === 'string' && !isEmpty(table) && cache.service === 1) {
                const key: string = cacheKey || table;
                const keyId: string = conditions && conditions?.id || '';
                setDataQuery(`${key}${keyId}`, query, resultData);
            }

            return resolve(resultData);
        });
    });
};

interface InsertDataOptions {
    table: string;
    data: Record<string, any>;
    protectedColumns?: string[];
    cacheKeys?: string[];
}

export const insertData = ({
    table,
    data,
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

        const columns: string[] = await checkColumn({ table });

        // remove invalid column from data
        filterColumn(data, columns);
        // remove invalid data
        filterData(data);

        let keys: string[] = Object.keys(data);
        // check protected columns on submitted data
        let forbiddenColumns: string[] = _.intersection(protectedColumns, keys);

        if (!isEmpty(forbiddenColumns)) {
            return resolve(resultData);
        }

        let column: string = keys.join(', ');

        // Prepare parameterized query ($1, $2, etc)
        let placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        // return id added so pg return new inserted ID
        let query: string = `INSERT INTO ${table} (${column}) VALUES (${placeholders}) RETURNING id`; 

        let values = keys.map(k => {
            let dataVal: any = null;

            if (typeof data[k] !== 'undefined') {
                dataVal = data[k];

                if (typeof dataVal === 'string') {
                    dataVal = dataVal.trim();

                    if (timeChar.includes(dataVal.toUpperCase())) {
                        dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    }

                    if (nullChar.includes(dataVal.toUpperCase())) {
                        dataVal = null;
                    }
                }
            }

            return dataVal;
        });

        pool.query(query, values, (err: Error | null, result: QueryResult): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || result.rowCount === null) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;

                if (cacheKeys && !isEmpty(cacheKeys)) {
                    cacheKeys.push(keyData);
                    deleteDataQuery(cacheKeys);
                } else {
                    deleteDataQuery([keyData]);
                }
            }

            resultData.total_data = result.rowCount;
            resultData.data = { id: result.rows[0]?.id || null };

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

        let timeChar: string[] = ['CURRENT_TIMESTAMP()', 'NOW()', 'CURRENT_TIMESTAMP'];
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

        if (isEmpty(keys)) {
            return resolve(resultData);
        }

        // check protected columns on submitted data
        const forbiddenColumns: string[] = _.intersection(protectedColumns, keys);

        if (!isEmpty(forbiddenColumns)) {
            return resolve(resultData);
        }

        const column: string = keys.join(', ');

        let values: any[] = [];
        let valueLines: string[] = [];
        let paramIndex = 1;

        for (let i = 0; i < data.length; i++) {
            // if index and 'data order' on each object not the same
            if (!_.isEqual(keys, Object.keys(data[i]))) {
                return resolve(resultData);
            }

            let linePlaceholders: string[] = [];

            keys.forEach(k => {
                let dataVal: string | number | null = null;

                if (typeof data[i][k] !== 'undefined') {
                    dataVal = data[i][k];

                    if (typeof dataVal === 'string') {
                        dataVal = dataVal.trim();

                        if (timeChar.includes(dataVal.toUpperCase())) {
                            dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                        }
                        if (nullChar.includes(dataVal.toUpperCase())) {
                            dataVal = null;
                        }
                    }
                }

                values.push(dataVal);
                linePlaceholders.push(`$${paramIndex++}`);
            });

            valueLines.push(`(${linePlaceholders.join(', ')})`);
        }

        let query: string = `INSERT INTO ${table} (${column}) VALUES ${valueLines.join(', ')}`;

        pool.query(query, values, (err: Error | null, result: QueryResult): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || result.rowCount === null) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;

                if (cacheKeys && !isEmpty(cacheKeys)) {
                    cacheKeys.push(keyData);
                    deleteDataQuery(cacheKeys);
                } else {
                    deleteDataQuery([keyData]);
                }
            }

            resultData.total_data = result.rowCount;
            resultData.data = data;

            return resolve(resultData);
        });
    });
};

interface InsertDuplicateUpdateDataOptions {
    table: string;
    data: Record<string, any>[];
    protectedColumns?: string[];
    conflictedColumns?: string;
    cacheKeys?: string[];
}

export const insertDuplicateUpdateData = ({
    table,
    data,
    protectedColumns,
    conflictedColumns,
    cacheKeys
}: InsertDuplicateUpdateDataOptions): Promise<ResultDataArray> => {
    return new Promise(async (resolve) => {
        let resultData: ResultDataArray = {
            total_data: 0,
            data: false
        };

        let timeChar: string[] = ['CURRENT_TIMESTAMP()', 'NOW()', 'CURRENT_TIMESTAMP'];
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
            update.push(`${v} = EXCLUDED.${v}`); 
        });

        const updateDuplicate: string = update.join(', ');

        let values: any[] = [];
        let valueLines: string[] = [];
        let paramIndex = 1;

        for (let i = 0; i < data.length; i++) {
            if (!_.isEqual(keys, Object.keys(data[i]))) {
                return resolve(resultData);
            }

            let linePlaceholders: string[] = [];

            keys.forEach(k => {
                let dataVal: any = null;

                if (typeof data[i][k] !== 'undefined') {
                    dataVal = data[i][k];

                    if (typeof dataVal === 'string') {
                        dataVal = dataVal.trim();

                        if (timeChar.includes(dataVal.toUpperCase())) {
                            dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                        }

                        if (nullChar.includes(dataVal.toUpperCase())) {
                            dataVal = null;
                        }
                    }
                }

                values.push(dataVal);
                linePlaceholders.push(`$${paramIndex++}`);
            });

            valueLines.push(`(${linePlaceholders.join(', ')})`);
        }

        let query: string = `INSERT INTO ${table} (${column}) VALUES ${valueLines.join(', ')} ON CONFLICT (${conflictedColumns}) DO UPDATE SET ${updateDuplicate}`;

        pool.query(query, values, (err: Error | null, result: QueryResult): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || result.rowCount === null) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;

                if (cacheKeys && !isEmpty(cacheKeys)) {
                    cacheKeys.push(keyData);
                    deleteDataQuery(cacheKeys);
                } else {
                    deleteDataQuery([keyData]);
                }
            }

            resultData.total_data = result.rowCount;
            resultData.data = data;

            return resolve(resultData);
        });
    });
};

interface UpdateDataOptions {
    table: string;
    data: Record<string, any>;
    conditions: Record<string, any>;
    protectedColumns?: string[];
    cacheKeys?: string[];
}

export const updateData = ({
    table,
    data,
    conditions,
    protectedColumns,
    cacheKeys
}: UpdateDataOptions): Promise<ResultDataObject> => {
    return new Promise(async (resolve) => {
        let resultData: ResultDataObject = {
            total_data: 0,
            data: false
        };

        let timeChar: string[] = ['CURRENT_TIMESTAMP()', 'NOW()', 'CURRENT_TIMESTAMP'];
        let nullChar: string[] = ['NULL'];
        let setData: string[] = [];
        let queryData: string = '';
        let setCond: string[] = [];
        let queryCond: string = '';
        let query: string = `UPDATE ${table}`;

        const columns: string[] = await checkColumn({ table });

        // remove invalid column from data
        filterColumn(data, columns);
        // remove invalid data
        filterData(data);

        // reject('Update query is unsafe without data and condition')
        if (isEmpty(data) || isEmpty(conditions)) {
            return resolve(resultData);
        }

        const keys: string[] = Object.keys(data);
        // check protected columns on submitted data
        const forbiddenColumns = _.intersection(protectedColumns, keys);

        if (!isEmpty(forbiddenColumns)) {
            return resolve(resultData);
        }

        keys.forEach(k => {
            let dataVal: string | number | null = null;

            if (typeof data[k] !== 'undefined') {
                dataVal = data[k];

                if (typeof dataVal === 'string') {
                    dataVal = dataVal.trim();

                    if (timeChar.includes(dataVal.toUpperCase())) {
                        dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    }
        
                    if (nullChar.includes(dataVal.toUpperCase())) {
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

        queryCond = setCond.join(' AND ');
        query += ` WHERE ${queryCond}`;

        pool.query(query, (err: Error | null, result: QueryResult): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || result.rowCount === null) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;
                const keyId = conditions['id'] || '';

                if (cacheKeys && !isEmpty(cacheKeys)) {
                    cacheKeys.push(keyData);

                    if (keyId) {
                        cacheKeys.push(`${table}:${keyId}`);
                    }

                    deleteDataQuery(cacheKeys);
                } else {
                    let keyToDelete = [keyData];

                    if (keyId) {
                        keyToDelete.push(`${table}:${keyId}`);
                    }

                    deleteDataQuery(keyToDelete);
                }
            }

            resultData.total_data = result.rowCount;
            resultData.data = conditions;

            if (resultData.total_data < 1) {
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

        pool.query(query, (err: Error | null, result: QueryResult): any => {
            if (err) {
                console.error(err);
                return resolve(resultData);
            }

            if (!result || result.rowCount === null) {
                return resolve(resultData);
            }

            if (cache.service === 1) {
                const keyData = `${table}:all`;
                const keyId = conditions['id'] || '';

                if (cacheKeys && !isEmpty(cacheKeys)) {
                    cacheKeys.push(keyData);

                    if (keyId) {
                        cacheKeys.push(`${table}:${keyId}`);
                    }

                    deleteDataQuery(cacheKeys);
                } else {
                    let keyToDelete = [keyData];

                    if (keyId) {
                        keyToDelete.push(`${table}:${keyId}`);
                    }

                    deleteDataQuery(keyToDelete);
                }
            }

            resultData.total_data = result.rowCount;

            if (result.rowCount > 0) {
                resultData.data = conditions;
            }

            return resolve(resultData);
        });
    });
};
