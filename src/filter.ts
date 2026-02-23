import { getRegexFromString, getValueFromObject, isNumber, log, safeGetArray, toNumber } from "./utils";

/**
 * Helper to validate that operands are not arrays for numeric/equality operators
 */
const ensureNotArray = (val: FilterValueType, expectedVal: FilterValueType, operator: string): void => {
    if (Array.isArray(val) || Array.isArray(expectedVal)) {
        throw new Error(`The '${operator}' operator does not support array values.`);
    }
};

/**
 * Functions to check if filter condition is met
 */
const operatorHandlers: { [key in FilterOperator]: (val: FilterValueType, expectedVal: FilterValueType) => boolean } = {
    "exists": val => val !== undefined,
    "not_exists": val => val === undefined,
    "contains": (val: FilterValueType, searchString: FilterValueType): boolean => {
        if (val === undefined || val === null || searchString === undefined || searchString === null) {
            return false;
        }

        const searchStr = searchString.toString();

        if (Array.isArray(val)) {
            return val.some(item => item != null && item.toString().includes(searchStr));
        }

        return val.toString().includes(searchStr);
    },
    "=": (val, expectedVal) => {
        ensureNotArray(val, expectedVal, "=");
        return isNumber(val as any) || isNumber(expectedVal as any) ? toNumber(val as any) == toNumber(expectedVal as any) : val == expectedVal;
    },
    ">": (val, expectedVal) => {
        ensureNotArray(val, expectedVal, ">");
        return toNumber(val as any) > toNumber(expectedVal as any);
    },
    "<": (val, expectedVal) => {
        ensureNotArray(val, expectedVal, "<");
        return toNumber(val as any) < toNumber(expectedVal as any);
    },
    ">=": (val, expectedVal) => {
        ensureNotArray(val, expectedVal, ">=");
        return toNumber(val as any) >= toNumber(expectedVal as any);
    },
    "<=": (val, expectedVal) => {
        ensureNotArray(val, expectedVal, "<=");
        return toNumber(val as any) <= toNumber(expectedVal as any);
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
        // Determine the operator to use
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
                operator = (expectedVal.includes("*") || regex) ? "matches" : "=";
            }
        }

        const func = operatorHandlers[operator];
        if (!func) {
            log(`Operator '${operator}' not supported. Supported operators: ${Object.keys(operatorHandlers).join(", ")}`);
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

    // Helper to create composite filters
    const createCompositeFilter = (
        key: "not" | "and" | "or",
        FilterClass: typeof NotFilter | typeof AndFilter | typeof OrFilter
    ): Filter | null => {
        if (!(key in config)) return null;

        const filters = safeGetArray((config as any)[key]);
        if (filters.length === 0) {
            throw new Error(`Invalid '${key}' filter specification: expected a non-empty array.`);
        }

        return new FilterClass(filters.map(createFilter));
    };

    return createCompositeFilter("not", NotFilter)
        || createCompositeFilter("and", AndFilter)
        || createCompositeFilter("or", OrFilter)
        || new FieldFilter(config as IFilter);
}