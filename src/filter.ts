import { getRegexFromString, getValueFromObject, isNumber, log, safeGetArray, toNumber } from "./utils";

/**
 * Functions to check if filter condition is met
 */
const operatorHandlers: { [key in FilterOperator]: (val: FilterValueType, expectedVal: FilterValueType) => boolean } = {
    "exists": val => val !== undefined,
    "not_exists": val => val === undefined,
    "contains": (val, searchString) => {
        if (val === undefined || val === null || searchString === undefined || searchString === null) {
            return false;
        }
        // If val is an array, check if it contains the searchString
        if (Array.isArray(val)) {
            return val.some(item => item !== null && item !== undefined && item.toString().indexOf(searchString!.toString()) !== -1);
        }
        // Otherwise, convert to string and search
        return val.toString().indexOf(searchString!.toString()) !== -1;
    },
    "=": (val, expectedVal) => {
        if (Array.isArray(val) || Array.isArray(expectedVal)) {
            throw new Error("The '=' operator does not support array values.");
        }
        return isNumber(val) || isNumber(expectedVal) ? toNumber(val) == toNumber(expectedVal) : val == expectedVal;
    },
    ">": (val, expectedVal) => {
        if (Array.isArray(val) || Array.isArray(expectedVal)) {
            throw new Error("The '>' operator does not support array values.");
        }
        return toNumber(val) > toNumber(expectedVal);
    },
    "<": (val, expectedVal) => {
        if (Array.isArray(val) || Array.isArray(expectedVal)) {
            throw new Error("The '<' operator does not support array values.");
        }
        return toNumber(val) < toNumber(expectedVal);
    },
    ">=": (val, expectedVal) => {
        if (Array.isArray(val) || Array.isArray(expectedVal)) {
            throw new Error("The '>=' operator does not support array values.");
        }
        return toNumber(val) >= toNumber(expectedVal);
    },
    "<=": (val, expectedVal) => {
        if (Array.isArray(val) || Array.isArray(expectedVal)) {
            throw new Error("The '<=' operator does not support array values.");
        }
        return toNumber(val) <= toNumber(expectedVal);
    },
    "matches": (val, pattern) => {
        if (val === undefined || val === null) {
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
export abstract class Filter {
    /**
     * Whether filter is permanent.
     *
     * Permanent filters removes entities/batteries from collections permanently
     * instead of making them hidden.
     */
    abstract get is_permanent(): boolean;

    /**
     * Whether filter is advanced.
     *
     * Advanced means relies on extra fields like display, device, area.
     */
    abstract get is_advanced(): boolean;

    /**
     * Checks whether entity meets the filter conditions.
     * @param entityData Hass entity data
     * @param state State override - battery state/level
     */
    abstract isValid(entityData: any, state?: string): boolean;
}

abstract class CompositeFilter extends Filter {
    constructor(protected filters: Filter[]) {
        super();
    }

    override get is_permanent(): boolean {
        return this.filters.every(filter => filter.is_permanent);
    }

    override get is_advanced(): boolean {
        return this.filters.some(filter => filter.is_advanced);
    }
}

export class NotFilter extends CompositeFilter {
    override isValid(entityData: any, state?: string): boolean {
        return !this.filters.every(filter => filter.isValid(entityData, state));
    }
}

export class AndFilter extends CompositeFilter {
    override isValid(entityData: any, state?: string): boolean {
        return this.filters.every(filter => filter.isValid(entityData, state));
    }
}

export class OrFilter extends CompositeFilter {
    override isValid(entityData: any, state?: string): boolean {
        return this.filters.some(filter => filter.isValid(entityData, state));
    }
}

export class FieldFilter extends Filter {

    override get is_permanent(): boolean {
        return this.config.name != "state";
    }

    override get is_advanced(): boolean {
        return this.config.name.startsWith("display.") || this.config.name.startsWith("device.") || this.config.name.startsWith("area.");
    }

    constructor(private config: IFilter) {
        super();
    }

    isValid(entityData: any, state?: string): boolean {
        const val = this.getValue(entityData, state);
        return this.meetsExpectations(val);
    }

    /**
     * Gets the value to validate.
     * @param entityData Hass entity data
     * @param state State override - battery state/level
     */
    private getValue(entityData: any, state?: string): FilterValueType {
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
    private meetsExpectations(val: FilterValueType): boolean {

        let operator = this.config.operator;
        if (!operator) {
            if (this.config.value === undefined) {
                operator = "exists";
            }
            else if (this.config.value === null) {
                operator = "=";
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

export function createFilter(config: FilterSpec): Filter {
    // Basic runtime validation to avoid crashes on invalid filter specs
    if (!config || typeof config !== "object") {
        throw new Error("Invalid filter specification: expected a non-null object.");
    }

    if ("not" in config) {
        const filters = safeGetArray(config.not);
        if (filters.length === 0) {
            throw new Error("Invalid 'not' filter specification: expected a non-empty array.");
        }

        return new NotFilter(filters.map(createFilter));
    }

    if ("and" in config) {
        const filters = safeGetArray(config.and);
        if (filters.length === 0) {
            throw new Error("Invalid 'and' filter specification: expected a non-empty array.");
        }

        return new AndFilter(filters.map(createFilter));
    }

    if ("or" in config) {
        const filters = safeGetArray(config.or);
        if (filters.length === 0) {
            throw new Error("Invalid 'or' filter specification: expected a non-empty array.");
        }

        return new OrFilter(filters.map(createFilter));
    }

    return new FieldFilter(config);
}