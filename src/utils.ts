export const printVersion = () => console.info(
    "%c BATTERY-STATE-CARD %c [VI]{version}[/VI]",
    "color: white; background: forestgreen; font-weight: 700;",
    "color: forestgreen; background: white; font-weight: 700;",
);

/**
 * Logs message in developer console
 * @param message Message to log
 * @param level Message level/importance
 */
export const log = (message: string, level: "warn" | "error" = "warn") => {
    console[level]("[battery-state-card] " + message);
}

/**
 * Checks whether given value is a number
 * @param val String value to check
 */
export const isNumber = (value: string | number | boolean | null | undefined): boolean => {
    if (value === undefined || value === null || typeof value === "boolean") {
        return false;
    }

    if (typeof(value) == "string") {
        // trying to solve decimal number formatting in some langs
        value = value.replace(",", ".");
    }

    return value !== '' && !isNaN(Number(value));
}

/**
 * Converts string representation of the number to the actual JS number
 * @param value String value to convert
 * @returns Result number
 */
export const toNumber = (value: string | number | boolean | null | undefined): number => {
    if (typeof(value) == "string") {
        // trying to solve decimal number formatting in some langs
        value = value.replace(",", ".");
    }

    return Number(value);
}

/**
 * Returns array of values regardles if given value is string array or null
 * @param val Value to process
 */
export const safeGetArray = <T>(val: T | T[] | undefined): T[] => {
    if (Array.isArray(val)) {
        return val;
    }

    return val !== undefined ? [val] : [];
};

/**
 * Converts config value to array of specified objects.
 *
 * ISimplifiedArray config object supports simple list of strings or even an individual item. This function
 * ensures we're getting an array in all situations.
 *
 * E.g. all of the below are valid entries and can be converted to objects
 * 1. Single string
 *   my_setting: "name"
 * 2. Single object
 *   my_setting:
 *     by: "name"
 *     desc: true
 * 3. Array of strings
 *   my_setting:
 *     - "name"
 *     - "state"
 * 4. Array of objects
 *   my_setting:
 *     - by: "name"
 *     - by: "sort"
 *       desc: true
 *
 * @param value Config array
 * @param defaultKey Key of the object to populate
 * @returns Array of objects
 */
export const safeGetConfigArrayOfObjects = <T>(value: ISimplifiedArray<T>, defaultKey: keyof T): T[] => {
    return safeGetArray(value).map(v => safeGetConfigObject(v, defaultKey));
}

/**
 * Converts string to object with given property or returns the object if it is not a string
 * @param value Value from the config
 * @param propertyName Property name of the expected config object to which value will be assigned
 */
 export const safeGetConfigObject = <T>(value: IObjectOrString<T>, propertyName: keyof T): T => {

    switch (typeof value) {
        case "string":
            const result = <any>{};
            result[propertyName] = value;
            return result;
        case "object":
            // make a copy as the original one is immutable
            return { ...value };
    }

    return value;
}

/**
 * Throttles given function calls. In given throttle time always the last arriving call is executed.
 * @param func Function to call
 * @param throttleMs Number of ms to wait before calling
 */
export const throttledCall = function <T extends Function>(func: T, throttleMs: number): T {
    let timeoutHook: any;
    return (<any>((...args: []) => {
        if (timeoutHook) {
            // cancel previous call
            clearTimeout(timeoutHook);
            timeoutHook = null;
        }

        // schedule new call
        timeoutHook = setTimeout(() => func.apply(null, args), 100);
    })) as T
}


const regexPattern = /\/(.*?)\/([igm]{1,3})/
/**
 * Extracts regex from the given string
 * @param ruleVal Value to process
 * @returns Parsed regex
 */
export const getRegexFromString = (ruleVal: string): RegExp | null => {
    if (ruleVal[0] == "/" && ruleVal[ruleVal.length - 1] == "/") {
        return new RegExp(ruleVal.substr(1, ruleVal.length - 2));
    }
    else {
        let matches = ruleVal.match(regexPattern)
        if (matches && matches.length == 3) {
            return new RegExp(matches[1], matches[2]);
        }
    }

    return null;
}

/**
 * Extracts value for given path from the object
 * @param dataObject Object to extract data from
 * @param path Path to the value
 * @returns Value from the path
 */
export const getValueFromObject = (dataObject: any, path: string): string | number | boolean | null | undefined => {
    const chunks = path.split(".");

    for (let i = 0; i < chunks.length; i++) {
        dataObject = dataObject[chunks[i]];
        if (dataObject === undefined) {
            break;
        }
    }

    if (dataObject !== null && typeof dataObject == "object") {
        dataObject = JSON.stringify(dataObject);
    }

    return dataObject;
}