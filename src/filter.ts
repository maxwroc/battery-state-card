import { getRegexFromString, getValueFromObject, isNumber, log, toNumber } from "./utils";

/**
 * Functions to check if filter condition is met
 */
const operatorHandlers: { [key in FilterOperator]: (val: string | number | undefined, expectedVal: string | number | undefined) => boolean } = {
    "exists": val => val !== undefined,
    "not_exists": val => val === undefined,
    "contains": (val, searchString) => val !== undefined && val.toString().indexOf(searchString!.toString()) != -1,
    "=": (val, expectedVal) => isNumber(val) || isNumber(expectedVal) ? toNumber(val) == toNumber(expectedVal) : val == expectedVal,
    ">": (val, expectedVal) => toNumber(val) > toNumber(expectedVal),
    "<": (val, expectedVal) => toNumber(val) < toNumber(expectedVal),
    ">=": (val, expectedVal) => toNumber(val) >= toNumber(expectedVal),
    "<=": (val, expectedVal) => toNumber(val) <= toNumber(expectedVal),
    "matches": (val, pattern) => {
        if (val === undefined) {
            return false;
        }

        pattern = pattern!.toString()

        let exp = getRegexFromString(pattern);
        if (!exp && pattern.includes("*")) {
            exp = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        }

        return exp ? exp.test(val.toString()) : val === pattern;
    }
}

/**
 * Filter class
 */
export class Filter {

    /**
     * Whether filter is permanent.
     *
     * Permanent filters removes entities/batteries from collections permanently
     * instead of making them hidden.
     */
    get is_permanent(): boolean {
        return this.config.name != "state";
    }

    constructor(private config: IFilter) {

    }

    /**
     * Checks whether entity meets the filter conditions.
     * @param entityData Hass entity data
     * @param state State override - battery state/level
     */
    isValid(entityData: any, state?: string): boolean {
        const val = this.getValue(entityData, state);
        return this.meetsExpectations(val);
    }

    /**
     * Gets the value to validate.
     * @param entityData Hass entity data
     * @param state State override - battery state/level
     */
    private getValue(entityData: any, state?: string): string | undefined {
        if (!this.config.name) {
            log("Missing filter 'name' property");
            return;
        }

        if (this.config.name == "state" && state !== undefined) {
            return state;
        }

        return getValueFromObject(entityData, this.config.name);
    }

    /**
     * Checks whether value meets the filter conditions.
     * @param val Value to validate
     */
    private meetsExpectations(val: string | number | undefined): boolean {

        let operator = this.config.operator;
        if (!operator) {
            if (this.config.value === undefined) {
                operator = "exists";
            }
            else {
                const expectedVal = this.config.value.toString();
                const regex = getRegexFromString(expectedVal);
                operator = expectedVal.indexOf("*") != -1 || regex ?
                    "matches" :
                    "=";
            }
        }

        const func = operatorHandlers[operator];
        if (!func) {
            log(`Operator '${this.config.operator}' not supported. Supported operators: ${Object.keys(operatorHandlers).join(", ")}`);
            return false;
        }

        return func(val, this.config.value);
    }
}