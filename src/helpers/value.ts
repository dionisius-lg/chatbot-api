const ipv4Regex = /^(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)$/;
const sensitiveKeys = ['secret', 'password'] as const;

/**
 * Checks if a value is empty.
 * A value is considered empty if it is:
 * - undefined or null
 * - a string containing only whitespace
 * - an empty array
 * - an empty object
 * - a number less than or equal to 0
 * 
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is empty, otherwise false.
 */
export function isEmpty(value: unknown): boolean {
    return (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && value !== null && Object.keys(value).length === 0) ||
        (typeof value === 'number' && value <= 0)
    );
}

/**
 * Checks if a value is numeric.
 * Supports numbers and numeric strings.
 * 
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is numeric, otherwise false.
 */
export function isNumeric(value: unknown): boolean {
    if (typeof value === 'number') {
        return Number.isFinite(value);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed !== '' && Number.isFinite(Number(trimmed));
    }

    return false;
}

/**
 * Checks if a value is a valid JSON string or a non-empty JSON-like object.
 * Returns the parsed object if it is valid JSON, or the object itself if it was already an object.
 * Returns false if it is invalid or empty.
 * 
 * @template T
 * @param {unknown} value - The value to check.
 * @returns {T | false} The parsed object or false.
 */
export function isJson<T = unknown>(value: unknown): T | false {
    if (value === null || value === undefined || isEmpty(value)) {
        return false;
    }

    if (typeof value === 'object') {
        return value as T;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (parsed !== null && typeof parsed === 'object' && !isEmpty(parsed)) {
                return parsed as T;
            }
        } catch {
            return false;
        }
    }

    return false;
}

/**
 * Checks if a string is a domain address (excluding IPv4 addresses and localhost).
 * 
 * @param {string} value - The address string to check.
 * @returns {boolean} True if the string is a domain address, otherwise false.
 */
export function isDomainAddress(value: string): boolean {
    return !ipv4Regex.test(value) && !value.includes('localhost');
}

/**
 * Generates a random string of a specified size.
 * 
 * @param {number} [size=32] - The length of the generated string.
 * @param {boolean} [numeric=false] - Whether to include numbers in the character pool.
 * @param {boolean} [specialChar=false] - Whether to include special characters in the character pool.
 * @returns {string} The generated random string.
 */
export function randomString(size = 32, numeric = false, specialChar = false): string {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    if (numeric) {
        characters += '0123456789';
    }

    if (specialChar) {
        characters += '!@#$&';
    }

    let result = '';
    const charLength = characters.length;

    for (let i = 0; i < size; i++) {
        const randomIndex = Math.floor(Math.random() * charLength);
        result += characters[randomIndex];
    }

    return result;
}

/**
 * Masks sensitive keys (like password, secret) in an object by replacing their string values with asterisks.
 * 
 * @template T
 * @param {T} data - The object to mask.
 * @returns {T} A new object with sensitive fields masked.
 */
export function maskSensitiveData<T extends Record<string, unknown>>(data: T): T {
    const result = { ...data };

    for (const [key, value] of Object.entries(result)) {
        if (sensitiveKeys.includes(key.toLowerCase() as (typeof sensitiveKeys)[number]) && typeof value === 'string') {
            result[key as keyof T] = '*'.repeat(value.length) as T[keyof T];
        }
    }

    return result;
}

/**
 * Converts a 1-based column number into its corresponding alphabetical Excel column name (e.g., 1 -> A, 27 -> AA).
 * 
 * @param {number} columnNumber - The 1-based column number.
 * @returns {string} The Excel column name.
 */
export function excelColumnName(columnNumber: number): string {
    let columnName = '';

    for (let a = 1, z = 26; (columnNumber -= a) >= 0; a = z, z *= 26) {
        columnName = String.fromCharCode(((columnNumber % z) / a) + 65) + columnName;
    }

    return columnName;
}

/**
 * Helper to check if a value is a plain object.
 * 
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if plain object, otherwise false.
 */
function isPlainObject(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
}

/**
 * Safely parses a JSON value.
 * If the value is an object, it parses recursively or returns it.
 * If parsing fails, returns the original value representation.
 * 
 * @template T
 * @param {unknown} value - The value to parse.
 * @returns {T | string | number | boolean | null} The parsed JSON or the input representation.
 */
export function safeJsonParse<T = unknown>(value: unknown): T | string | number | boolean | null {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.map((item) => safeJsonParse(item)) as any;
        }
        if (isPlainObject(value)) {
            const parsedObj: Record<string, any> = {};
            for (const [k, v] of Object.entries(value)) {
                parsedObj[k] = safeJsonParse(v);
            }
            return parsedObj as T;
        }
        return value as any;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string' && parsed === value) {
                return parsed;
            }
            return safeJsonParse(parsed) as any;
        } catch {
            return value;
        }
    }

    return value as any;
}
