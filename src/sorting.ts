import { IBatteryCollection } from "./battery-provider";
import { isNumber, log, safeGetConfigArrayOfObjects, toNumber } from "./utils";

/**
 * Sorts batteries by given criteria and returns their IDs
 * @param config Card configuration
 * @param batteries List of all known battery elements
 * @returns List of battery IDs (batteries sorted by given criteria)
 */
 export const getIdsOfSortedBatteries = (config: IBatteryCardConfig, batteries: IBatteryCollection): string[] => {
    let batteriesToSort = Object.keys(batteries);

    const sortOptions = safeGetConfigArrayOfObjects(config.sort, "by").filter(o => o.by);

    return batteriesToSort.sort((idA, idB) => {
        let result = 0;
        sortOptions.find(o => {

            let valA: any;
            let valB: any;

            switch(o.by) {
                case "name":
                    valA = batteries[idA].name;
                    valB = batteries[idB].name;
                    break;
                case "state":
                    // always prefer numeric state for sorting
                    valA = batteries[idA].stateNumeric == undefined ? batteries[idA].state : batteries[idA].stateNumeric;
                    valB = batteries[idB].stateNumeric == undefined ? batteries[idB].state : batteries[idB].stateNumeric;
                    break;
                default:
                    if ((<string>o.by).startsWith("entity.")) {
                        const path = (<string>o.by).substring(7);
                        valA = batteries[idA].accessor?.resolve(path);
                        valB = batteries[idB].accessor?.resolve(path);
                    }
                    else {
                        log("Unknown sort field: " + o.by, "warn");
                    }
            }

            if (isNumber(valA) || isNumber(valB)) {
                result = compareNumbers(valA, valB);
            }
            else if (valA === undefined) {
                if (valB === undefined) {
                    result = 0;
                }
                else {
                    result = -1;
                }
            }
            else {
                result = compareStrings(valA, valB);
            }

            if (o.desc) {
                // opposite result
                result *= -1;
            }

            return result != 0;
        });

        return result;
    });
}

/**
 * Number comparer
 * @param a Value A
 * @param b Value B
 * @returns Comparison result
 */
 const compareNumbers = (a: string, b: string): number => {
    let aNum = toNumber(a);
    let bNum = toNumber(b);
    aNum = isNaN(aNum) ? -1 : aNum;
    bNum = isNaN(bNum) ? -1 : bNum;
    return aNum - bNum;
}


/**
 * String comparer
 * @param a Value A
 * @param b Value B
 * @returns Comparison result
 */
 const compareStrings = (a: string, b: string): number => a.localeCompare(b);