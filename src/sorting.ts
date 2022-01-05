import { IBatteryCollection } from "./battery-provider";
import { log, safeGetConfigArrayOfObjects } from "./utils";

/**
 * Sorts batteries by given criterias and returns their IDs
 * @param config Card configuration
 * @param batteries List of all known battery elements
 * @returns List of battery IDs (batteries sorted by given criterias)
 */
 export const getIdsOfSortedBatteries = (config: IBatteryCardConfig, batteries: IBatteryCollection): string[] => {
    let batteriesToSort = Object.keys(batteries);

    const sortOptions = safeGetConfigArrayOfObjects(config.sort, "by");

    return batteriesToSort.sort((idA, idB) => {
        let result = 0;
        sortOptions.find(o => {

            switch(o.by) {
                case "name":
                    result = compareStrings(batteries[idA].name, batteries[idB].name);
                    break;
                case "state":
                    result = compareNumbers(batteries[idA].state, batteries[idB].state);
                    break;
                default:
                    log("Unknown sort field: " + o.by, "warn");
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
    let aNum = Number(a);
    let bNum = Number(b);
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