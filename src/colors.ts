import { log, safeGetConfigArrayOfObjects } from "./utils";

/**
 * Gets icon color
 * @param config Entity config
 * @param batteryLevel Battery level/state
 * @param isCharging Whether battery is in chargin mode
 * @returns Icon color
 */
 export const getColorForBatteryLevel = (config: IBatteryEntityConfig, batteryLevel: number | undefined, isCharging: boolean): string => {

    if (isCharging && config.charging_state?.color) {
        return config.charging_state.color;
    }

    if (batteryLevel === undefined || isNaN(batteryLevel)) {
        return defaultColor;
    }

    const colorSteps = safeGetConfigArrayOfObjects(config.colors?.steps, "color");

    if (config.colors?.gradient) {
        return getGradientColors(colorSteps, batteryLevel, config.colors?.non_percent_values);
    }

    let thresholds: IColorSteps[] = defaultColorSteps;
    if (config.colors?.steps) {
        // making sure the value is always set
        thresholds = colorSteps.map(s => {
            s.value = s.value === undefined ? 100 : s.value;
            return s;
        });
    }

    return thresholds.find(th => batteryLevel <= th.value!)?.color || lastObject(thresholds).color || defaultColor;
}

/**
 * Gets color for given battery level (smooth transition between step colors)
 * @param config Color steps
 * @param level Battery level
 * @returns Hex HTML color
 */
const getGradientColors = (config: IColorSteps[], level: number, nonPercentValues?: boolean): string => {

    let colorList = config.map(s => s.color);
    if (!isColorGradientValid(colorList)) {
        log("For gradient colors you need to use hex HTML colors. E.g. '#FF00FF'", "error");
        return defaultColor;
    }

    if (colorList.length < 2) {
        log("For gradient colors you need to specify at least two steps/colors", "error");
        return defaultColor;
    }

    // if values were used we should respect them and calculate gradient between them
    if (config.every(s => s.value != undefined)) {
        
        const first = config[0];
        if (level <= first.value!) {
            return first.color;
        }

        const last = lastObject(config);
        if (level >= last.value!) {
            return last.color;
        }

        const index = config.findIndex(s => level <= s.value!);
        if (index != -1) {
            colorList = [ config[index - 1].color, config[index].color ];
            // calculate percentage
            level = (level - config[index - 1].value!) * 100 / (config[index].value! - config[index - 1].value!);
        }
        // checking whether we should convert the level to the percentage
        else if ((nonPercentValues == undefined && config.some(s => s.value! < 0 || s.value! > 100)) || nonPercentValues === true) {
            level = convertToPercentage(config, level);
        }
    }
    else if (level < 0 || level > 100) {
        log("Entity state value seems to be outside of 0-100 range and color step values are not defined");
        return defaultColor;
    }

    return getColorInterpolationForPercentage(colorList, level);
}

const convertToPercentage = (colorSteps: IColorSteps[], value: number) => {
    const values = colorSteps.map((s, i) => s.value === undefined ? i : s.value)

    const dist = values[values.length - 1] - values[0];
    const valueAdjusted = value - values[0];

    return Math.round(valueAdjusted / dist * 100);
}

/**
 * Default color (inherited color)
 */
const defaultColor = "inherit";

/**
 * Default step values
 */
const defaultColorSteps: IColorSteps[] = [{ value: 20, color: "var(--label-badge-red)" }, { value: 55, color: "var(--label-badge-yellow)" }, { value: 100, color: "var(--label-badge-green)" }];

/**
 * HTML color pattern
 */
 const htmlColorPattern = /^#[A-Fa-f0-9]{6}$/;

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
const getColorInterpolationForPercentage = function (colors: string[], pct: number): string {
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
    return "#" + [color.r, color.g, color.b].map(i => i.toString(16).padStart(2, "0")).join("") ;
};

/**
 * Tests whether given color gradient elements are valid
 * @param gradientColors Gradient color steps
 * @returns Whether the given collection is valid
 */
 const isColorGradientValid = (gradientColors: string[]) => {
    if (gradientColors.length < 2) {
        log("Value for 'color_gradient' should be an array with at least 2 colors.");
        return false;
    }

    for (const color of gradientColors) {
        if (!htmlColorPattern.test(color)) {
            log("Color '${color}' is not valid. Please provide valid HTML hex color in #XXXXXX format.");
            return false;
        }
    }

    return true;
}

const lastObject = <T>(collelction: T[]): T => collelction && collelction.length > 0 ? collelction[collelction.length - 1] : <T>{};