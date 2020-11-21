import { HomeAssistant } from "./ha-types";

console.info(
    "%c BATTERY-STATE-CARD %c 1.6.0",
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
 * Converts HTML hex color to RGB values
 *
 * @param color Color to convert
 */
const convertHexColorToRGB = (color: string) => {
    color = color.replace("#", "");
    return {
        r: parseInt(color.substr(0, 2), 16),
        g: parseInt(color.substr(2, 2), 16),
        b: parseInt(color.substr(4, 2), 16),
    }
};

/**
 * Gets color interpolation for given color range and percentage
 *
 * @param colors HTML hex color values
 * @param pct Percent
 */
export const getColorInterpolationForPercentage = function (colors: string[], pct: number): string {
    // convert from 0-100 to 0-1 range
    pct = pct / 100;

    const percentColors = colors.map((color, index) => {
        return {
            pct: (1 / (colors.length - 1)) * index,
            color: convertHexColorToRGB(color)
        }
    });

    let colorBucket = 1
    for (colorBucket = 1; colorBucket < percentColors.length - 1; colorBucket++) {
        if (pct < percentColors[colorBucket].pct) {
            break;
        }
    }

    const lower = percentColors[colorBucket - 1];
    const upper = percentColors[colorBucket];
    const range = upper.pct - lower.pct;
    const rangePct = (pct - lower.pct) / range;
    const pctLower = 1 - rangePct;
    const pctUpper = rangePct;
    const color = {
        r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
        g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
        b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
    };
    return "rgb(" + [color.r, color.g, color.b].join(",") + ")";
};

/**
 * Checks whether given value is a number
 * @param val String value to check
 */
export const isNumber = (val: string) => !isNaN(Number(val));

/**
 * Returns array of values regardles if given value is string array or null
 * @param val Value to process
 */
export const safeGetArray = <T>(val: T | T[] | undefined): T[] => {
    if (Array.isArray(val)) {
        return val;
    }

    return val ? [val] : [];
};

/**
 * Converts string to object with given property or returns the object if it is not a string
 * @param value Value from the config
 * @param propertyName Property name of the expected config object to which value will be assigned
 */
export const safeGetConfigObject = <T>(value: string | T, propertyName: string): T => {

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
 * Converts given date to localized string representation of relative time
 * @param hass Home Assistant instance
 * @param rawDate Date string
 */
export const getRelativeTime = (hass: HomeAssistant, rawDate: string): string => {
    let time = Date.parse(rawDate);
    if (isNaN(time)) {
        return hass.localize("ui.components.relative_time.never");
    }

    time = Math.round((Date.now() - time) / 1000); // convert to seconds diff

    // https://github.com/yosilevy/home-assistant-polymer/blob/master/src/translations/en.json
    let relativeTime = "";
    if (time < 60) {
        relativeTime = hass.localize("ui.components.relative_time.past_duration.second", "count", time);
    } else if (time < 60 * 60) {
        relativeTime = hass.localize("ui.components.relative_time.past_duration.minute", "count", Math.round(time / 60));
    } else if (time < 60 * 60 * 24) {
        relativeTime = hass.localize("ui.components.relative_time.past_duration.hour", "count", Math.round(time / (60 * 60)));
    } else if (time < 60 * 60 * 24 * 7) {
        relativeTime = hass.localize("ui.components.relative_time.past_duration.day", "count", Math.round(time / (60 * 60 * 24)));
    } else {
        relativeTime = hass.localize("ui.components.relative_time.past_duration.weeks", "count", Math.round(time / (60 * 60 * 24 * 7)));
    }

    return relativeTime;
}

/**
 * Prefixes all css selectors with given value.
 * @param containerCssPath Prefix to be added
 * @param styles Styles to process
 */
export const processStyles = (containerCssPath: string, styles: string) => styles.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, match => `${containerCssPath} ${match}`);

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