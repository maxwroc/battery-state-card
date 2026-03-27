
export const printVersion = () => console.info(
    "%c BATTERY-STATE-CARD %c [VI]{version}[/VI]",
    "color: white; background: forestgreen; font-weight: 700;",
    "color: forestgreen; background: white; font-weight: 700;",
);

/**
 * Set to track logged messages and prevent duplicates
 */
const loggedMessages = new Set<string>();

/**
 * Logs message in developer console
 * @param message Message to log
 * @param level Message level/importance
 */
export const log = (message: string, level: "warn" | "error" = "warn") => {
    const key = `${level}:${message}`;
    if (loggedMessages.has(key)) {
        return;
    }

    loggedMessages.add(key);
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

const timeUnits: { [key: string]: number } = {
    "m": 60 * 1000,
    "h": 60 * 60 * 1000,
    "d": 24 * 60 * 60 * 1000,
    "w": 7 * 24 * 60 * 60 * 1000,
};

/**
 * Parses relative time string (e.g. "24h", "30m", "7d", "2w") into milliseconds
 * @param val Relative time string
 * @returns Duration in milliseconds or undefined if parsing fails
 */
export const parseRelativeTime = (val: string): number | undefined => {
    const match = val.match(/^(\d+(?:\.\d+)?)\s*([mhdw])$/);
    if (!match) {
        return undefined;
    }

    return parseFloat(match[1]) * timeUnits[match[2]];
}

/**
 * Returns array of values regardless if given value is string array or null
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
 * Converts string to object with given property or returns the object (its copy) if it is not a string
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
        timeoutHook = setTimeout(() => func.apply(null, args), throttleMs);
    })) as T
}


const regexPattern = /\/(.*?)\/([igm]{1,3})/
/**
 * Extracts regex from the given string
 * @param ruleVal Value to process
 * @returns Parsed regex
 */
export const getRegexFromString = (ruleVal: string): RegExp | null => {
    try {
        if (ruleVal[0] == "/" && ruleVal[ruleVal.length - 1] == "/") {
            return new RegExp(ruleVal.substr(1, ruleVal.length - 2));
        }
        else {
            let matches = ruleVal.match(regexPattern)
            if (matches && matches.length == 3) {
                return new RegExp(matches[1], matches[2]);
            }
        }
    }
    catch (e) {
        log(`Invalid regex pattern: ${ruleVal}`);
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



/**
 * Converts theme object to CSS variables string for inline styles
 * @param hass Home Assistant object
 * @param themeName Name of the theme to apply
 * @returns CSS variables string or undefined if theme not found
 */
export const getThemeStyles = (hass: any, themeName: string | undefined): string | undefined => {
    if (!hass || !themeName || !hass.themes || !hass.themes.themes) {
        return undefined;
    }

    const themes = hass.themes.themes;
    let themeData = themes[themeName];

    if (!themeData) {
        log(`Theme "${themeName}" not found in Home Assistant`);
        return undefined;
    }

    // Check if theme has modes (light/dark)
    if (themeData.modes) {
        const isDarkMode = hass.themes.darkMode || false;
        themeData = isDarkMode ? themeData.modes.dark : themeData.modes.light;

        if (!themeData) {
            log(`Theme "${themeName}" mode not found (dark: ${isDarkMode})`);
            return undefined;
        }
    }

    // Convert theme properties to CSS variables
    // Theme objects in HA contain all CSS variables, not just the limited set in Theme interface
    const cssVars: string[] = [];
    for (const [key, value] of Object.entries<any>(themeData)) {
        // Skip the 'modes' property if it exists
        if (key === 'modes') {
            continue;
        }
        // Theme properties are already in the format we need (some might already have --)
        const varName = key.startsWith('--') ? key : `--${key}`;
        cssVars.push(`${varName}: ${value}`);
    }

    return cssVars.join('; ');
}