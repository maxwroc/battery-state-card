import { ICollapsingGroupConfig, IBatteryGroupViewData, IBatteriesResultViewData, IHomeAssistantGroupProps, IGroupDataMap } from "./types"
import BatteryViewModel from "./battery-vm"
import { log } from "./utils";

/**
 * Returns battery collections to render
 * @param config Collapsing config
 * @param batteries Battery view models
 * @param haGroupData Home assistant group data
 */
export const getBatteryCollections = (config: number | ICollapsingGroupConfig[] | undefined, batteries: BatteryViewModel[], haGroupData: IGroupDataMap): IBatteriesResultViewData => {
    const result: IBatteriesResultViewData = {
        batteries: [],
        groups: []
    };

    if (!config) {
        result.batteries = batteries;
        return result;
    }

    if (typeof config == "number") {
        result.batteries = batteries.slice(0, config);
        result.groups.push(createGroup(haGroupData, batteries.slice(config)));
    }
    else {// make sure that max property is set for every group
        populateMinMaxFields(config);

        batteries.forEach(b => {
            const level = isNaN(Number(b.level)) ? 0 : Number(b.level);
            const foundIndex = getGroupIndex(config, b, haGroupData);
            if (foundIndex == -1) {
                // batteries without group
                result.batteries.push(b);
            }
            else {
                // bumping group index as the first group is for the orphans
                result.groups[foundIndex] = result.groups[foundIndex] || createGroup(haGroupData, [], config[foundIndex]);
                result.groups[foundIndex].batteries.push(b);
            }
        });
    }

    // update group title
    result.groups.forEach(g => {
        if (g.name) {
            g.name = getEnrichedText(g.name, g);
        }

        if (g.secondary_info) {
            g.secondary_info = getEnrichedText(g.secondary_info, g);
        }
    });

    return result;
}

/**
 * Returns group index to which battery should be assigned.
 * @param config Collapsing groups config
 * @param battery Batterry view model
 * @param haGroupData Home assistant group data
 */
const getGroupIndex = (config: ICollapsingGroupConfig[], battery: BatteryViewModel, haGroupData: IGroupDataMap): number => {
    return config.findIndex(group => {

        if (group.group_id &&
            haGroupData[group.group_id] &&
            !haGroupData[group.group_id].entity_id?.some(id => battery.entity_id == id)) {

            return false;
        }

        if (group.entities && !group.entities.some(id => battery.entity_id == id)) {
            return false
        }

        const level = isNaN(Number(battery.level)) ? 0 : Number(battery.level);

        return level >= group.min! && level <= group.max!;
    });
}

/**
 * Sets missing max/min fields.
 * @param config Collapsing groups config
 */
var populateMinMaxFields = (config: ICollapsingGroupConfig[]): void => config
    .sort((a, b) => (a.min || 0) - (b.min || 0))
    .forEach((g, i) => {
        if (g.min == undefined) {
            g.min = 0;
        }

        if (g.max != undefined && g.max < g.min) {
            log("Collapse group min value should be lower than max.\n" + JSON.stringify(g, null, 2));
            return;
        }

        if (g.max == undefined) {
            g.max = 100;
        }
    });

/**
 * Creates and returns group view data object.
 * @param haGroupData Home assistant group data
 * @param batteries Batterry view model
 * @param config Collapsing group config
 */
const createGroup = (haGroupData: IGroupDataMap, batteries: BatteryViewModel[] = [], config?: ICollapsingGroupConfig): IBatteryGroupViewData => {

    if (config?.group_id && !haGroupData[config.group_id]) {
        throw new Error("Group not found: " + config.group_id);
    }

    let name = config?.name;
    if (!name && config?.group_id) {
        name = haGroupData[config.group_id].friendly_name;
    }

    let icon = config?.icon;
    if (icon === undefined && config?.group_id) {
        icon = haGroupData[config.group_id].icon;
    }

    return {
        name: name,
        icon: icon,
        batteries: batteries,
        secondary_info: config?.secondary_info
    }
}

/**
 * Replaces all keywords, used in the text, with values
 * @param text Text to process
 * @param group Battery group view data
 */
const getEnrichedText = (text: string, group: IBatteryGroupViewData): string => {
    text = text.replace(/\{[a-z]+\}/g, keyword => {
        switch (keyword) {
            case "{min}":
                return group.batteries.reduce((agg, b) => agg > Number(b.level) ? Number(b.level) : agg, 100).toString();
            case "{max}":
                return group.batteries.reduce((agg, b) => agg < Number(b.level) ? Number(b.level) : agg, 0).toString();
            case "{count}":
                return group.batteries.length.toString();
            case "{range}":
                const min = group.batteries.reduce((agg, b) => agg > Number(b.level) ? Number(b.level) : agg, 100).toString();
                const max = group.batteries.reduce((agg, b) => agg < Number(b.level) ? Number(b.level) : agg, 0).toString();
                return min == max ? min : min + "-" + max;
            default:
                return keyword;
        }
    });

    return text;
}