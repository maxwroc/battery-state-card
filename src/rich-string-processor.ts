import { HomeAssistant } from "custom-card-helpers";
import { log } from "./utils";

const validEntityDomains = ["sensor", "binary_sensor"];

/**
 * Class for processing keyword strings
 */
 export class RichStringProcessor {

    private entityData: IMap<string> = {};

    constructor(private hass: HomeAssistant | undefined, private entityId: string, private customData?: IMap<string>) {
        this.entityData = <any>{
            ...hass?.states[entityId]
        }
    }

    /**
     * Replaces keywords in given string with the data
     */
    process(text: string): string {
        if (text === "") {
            return text;
        }

        return text.replace(/\{([^\}]+)\}/g, (matchWithBraces, keyword) => this.replaceKeyword(keyword, matchWithBraces));
    }

    /**
     * Converts keyword in the final value
     */
    private replaceKeyword(keyword: string, defaultValue: string): string {
        const processingDetails = keyword.split("|");
        const dataSource = processingDetails.shift();

        const value = this.getValue(dataSource);

        if (value === undefined) {
            return defaultValue;
        }

        const processors = processingDetails.map(command => {
            const match = commandPattern.exec(command);
            if (!match || !match.groups || !availableProcessors[match.groups.func]) {
                return undefined;
            }

            return availableProcessors[match.groups.func](match.groups.params);
        });

        const result = processors.filter(p => p !== undefined).reduce((res, proc) => proc!(res), value);

        return result === undefined ? defaultValue : result;
    }

    private getValue(dataSource: string | undefined): string | undefined {

        if (dataSource === undefined) {
            return dataSource;
        }

        const chunks = dataSource.split(".");
        let data = <any>this.entityData;

        if (validEntityDomains.includes(chunks[0])) {
            data = {
                ...this.hass?.states[chunks.splice(0, 2).join(".")]
            };
        }

        data = {
            ...data,
            ...this.customData
        }

        for (let i = 0; i < chunks.length; i++) {
            data = data[chunks[i]];
            if (data === undefined) {
                break;
            }
        }

        if (typeof data == "object") {
            data = JSON.stringify(data);
        }

        return data === undefined ? undefined : data.toString();
    }
}

const commandPattern = /(?<func>[a-z]+)\((?<params>[^\)]*)\)/;

const availableProcessors: IMap<IProcessorCtor> = {
    "replace": (params) => {
        const replaceDataChunks = params.split("=");
        if (replaceDataChunks.length != 2) {
            log("'replace' function param has to have single equal char");
            return undefined;
        }

        return val => {
            return val.replace(replaceDataChunks[0], replaceDataChunks[1])
        };
    },
    "round": (params) => {
        let decimalPlaces = parseInt(params);
        if (isNaN(decimalPlaces)) {
            decimalPlaces = 0;
        }

        return val => parseFloat(val).toFixed(decimalPlaces);
    },
    "multiply": (params) => {
        if (params === "") {
            log("[KString]multiply function is missing parameter");
            return val => val;
        }

        const multiplier = Number(params);

        return val => isNaN(multiplier) ? val : (Number(val) * multiplier).toString();
    },
    "greaterthan": (params) => {
        const chunks = params.split(",");
        if (chunks.length != 2) {
            log("[KString]greaterthan function requires two parameters");
            return val => val;
        }

        const compareTo = Number(chunks[0]);
        return val =>  Number(val) > compareTo ? chunks[1] : val;
    },
    "lessthan": (params) => {
        const chunks = params.split(",");
        if (chunks.length != 2) {
            log("[KString]lessthan function requires two parameters");
            return val => val;
        }

        const compareTo = Number(chunks[0]);
        return val =>  Number(val) < compareTo ? chunks[1] : val;
    },
    "between": (params) => {
        const chunks = params.split(",");
        if (chunks.length != 3) {
            log("[KString]between function requires three parameters");
            return val => val;
        }

        const compareLower = Number(chunks[0]);
        const compareGreater = Number(chunks[1]);
        return val => {
            const numericVal = Number(val);
            return compareLower < numericVal && compareGreater > numericVal ? chunks[2] : val;
        }
    },
    "thresholds": (params) => {
        const thresholds = params.split(",").map(v => Number(v));

        return val => {
            const numericVal = Number(val);
            const result = thresholds.findIndex(v => numericVal < v);

            if (result == -1) {
                // looks like the value is higher than the last threshold
                return "100";
            }

            return Math.round(100 / thresholds.length * result).toString();
        }
    },
    "abs": () => 
        val => Math.abs(Number(val)).toString(),
}

interface IProcessor {
    (val: string): string;
}

interface IProcessorCtor {
    (params: string): IProcessor | undefined
}

