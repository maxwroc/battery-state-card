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
export const isNumber = (value: string | number): boolean =>
    {
        return (value !== null && value !== '' && !isNaN(Number(value)))
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
