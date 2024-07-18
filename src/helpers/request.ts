/**
 * Remove invalid column from object
 * @param {Record<string, any>} object
 * @param {string[]} keys 
 */
export const filterColumn = (object: Record<string, any> = {}, keys: string[] = []) => {
    Object.keys(object).forEach((key) => {
        if (!keys.includes(key)) {
            delete object[key];
        }
    });
};

/**
 * Remove invalid data from object
 * @param {Record<string, any>} object
 */
export const filterData = (object: Record<string, any> = {}) => {
    Object.keys(object).forEach((key) => {
        if (object[key] === undefined || object[key] === false) {
            delete object[key];
        }

        if ((typeof object[key] === 'string' && (object[key]).trim() === '') && object[key] !== null) {
            object[key] = null;
        }
    });
};

/**
 * Return new valid object value
 * @param {Record<string, any>} object
 * @param {string[]} params
 * @returns {Record<string, any>}
 */
export const filterParam = (object: Record<string, any> = {}, params: string[] = []) => {
    let options: Record<string, any> = {};

    params.forEach((param) => {
        if (object[param] !== undefined || object[param] !== '') {
            options[param] = object[param];
        }
    });

    return options;
};