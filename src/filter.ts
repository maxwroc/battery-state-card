import { EntityDataAccessor } from "./entity-data-accessor";
import { RichStringProcessor } from "./rich-string-processor";
import { getRegexFromString, getValueFromObject, isNumber, log, parseRelativeTime, safeGetArray, toNumber } from "./utils";

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
        const durationMs = parseRelativeTime(String(expectedVal));
        if (durationMs !== undefined) {
            const timestamp = new Date(String(val)).getTime();
            return !isNaN(timestamp) && Date.now() - timestamp > durationMs;
        }
        return toNumber(val as any) > toNumber(expectedVal as any);
    },
    "<": (val, expectedVal) => {
        ensureNotArray(val, expectedVal, "<");
        const durationMs = parseRelativeTime(String(expectedVal));
        if (durationMs !== undefined) {
            const timestamp = new Date(String(val)).getTime();
            return !isNaN(timestamp) && Date.now() - timestamp < durationMs;
        }
        return toNumber(val as any) < toNumber(expectedVal as any);
    },
    ">=": (val, expectedVal) => {
        ensureNotArray(val, expectedVal, ">=");
        const durationMs = parseRelativeTime(String(expectedVal));
        if (durationMs !== undefined) {
            const timestamp = new Date(String(val)).getTime();
            return !isNaN(timestamp) && Date.now() - timestamp >= durationMs;
        }
        return toNumber(val as any) >= toNumber(expectedVal as any);
    },
    "<=": (val, expectedVal) => {
        ensureNotArray(val, expectedVal, "<=");
        const durationMs = parseRelativeTime(String(expectedVal));
        if (durationMs !== undefined) {
            const timestamp = new Date(String(val)).getTime();
            return !isNaN(timestamp) && Date.now() - timestamp <= durationMs;
        }
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
     * Checks whether entity meets the filter conditions.
     * @param data Entity data accessor
     */
    abstract isValid(data: EntityDataAccessor): boolean;
}

abstract class CompositeFilter extends Filter {
    constructor(protected filters: Filter[]) {
        super();
    }

    override get is_permanent(): boolean {
        return this.filters.every(filter => filter.is_permanent);
    }
}

export class NotFilter extends CompositeFilter {
    override isValid(data: EntityDataAccessor): boolean {
        return !this.filters.every(filter => filter.isValid(data));
    }
}

export class AndFilter extends CompositeFilter {
    override isValid(data: EntityDataAccessor): boolean {
        return this.filters.every(filter => filter.isValid(data));
    }
}

export class OrFilter extends CompositeFilter {
    override isValid(data: EntityDataAccessor): boolean {
        return this.filters.some(filter => filter.isValid(data));
    }
}

export class FieldFilter extends Filter {

    override get is_permanent(): boolean {
        return this.config.name != "state" && !this.config.name.startsWith("computed.");
    }

    constructor(private config: IFilter) {
        super();
    }

    isValid(data: EntityDataAccessor): boolean {
        const val = this.getValue(data);
        return this.meetsExpectations(val, data);
    }

    /**
     * Gets the value to validate.
     * @param data Entity data accessor
     */
    private getValue(data: EntityDataAccessor): FilterValueType {
        if (!this.config.name) {
            log("Missing filter 'name' property");
            return;
        }

        return data.resolve(this.config.name);
    }

    /**
     * Checks whether value meets the filter conditions.
     * @param val Value to validate
     */
    private meetsExpectations(val: FilterValueType, data: EntityDataAccessor): boolean {
        // Resolve template strings in the filter value (e.g., "{input_number.low_battery_threshold}")
        let expectedValue = this.config.value;
        if (typeof expectedValue === "string" && expectedValue.includes("{")) {
            const processor = new RichStringProcessor(data);
            const resolved = processor.process(expectedValue);
            expectedValue = isNumber(resolved) ? toNumber(resolved) : resolved;
        }

        // Determine the operator to use
        let operator = this.config.operator;
        if (!operator) {
            if (expectedValue === undefined) {
                operator = "exists";
            }
            else if (expectedValue === null) {
                operator = "=";
            }
            else {
                const expectedVal = expectedValue.toString();
                const regex = getRegexFromString(expectedVal);
                operator = (expectedVal.includes("*") || regex) ? "matches" : "=";
            }
        }

        const func = operatorHandlers[operator];
        if (!func) {
            log(`Operator '${operator}' not supported. Supported operators: ${Object.keys(operatorHandlers).join(", ")}`);
            return false;
        }

        return func(val, expectedValue);
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