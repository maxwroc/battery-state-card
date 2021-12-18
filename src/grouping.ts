import { ICollapsingGroupConfig, IGroupDataMap } from "./types"
import { log } from "./utils";
import { IBatteryCollection, IBatteryCollectionItem } from "./battery-provider";

export interface IBatteryGroup {
    title?: string;
    secondaryInfo?: string;
    icon?: string;
    batteryIds: string[];
}

export interface IBatteryGroupResult {
    list: string[];
    groups: IBatteryGroup[];
}

/**
 * Returns battery collections to render
 */
export const getBatteryGroups = (batteries: IBatteryCollection, sortedIds: string[], config: number | ICollapsingGroupConfig[] | undefined, haGroupData: IGroupDataMap): IBatteryGroupResult => {
    const result: IBatteryGroupResult = {
        list: [],
        groups: []
    };

    if (!config) {
        result.list = sortedIds;
        return result;
    }

    if (typeof config == "number") {
        let visibleBatteries = sortedIds.filter(id => !batteries[id].isHidden);
        result.list = visibleBatteries.slice(0, config);
        result.groups.push(createGroup(haGroupData, visibleBatteries.slice(config)));
    }
    else {// make sure that max property is set for every group
        populateMinMaxFields(config);

        sortedIds.forEach(id => {
            const foundIndex = getGroupIndex(config, batteries[id], haGroupData);
            if (foundIndex == -1) {
                // batteries without group
                result.list.push(id);
            }
            else {
                // bumping group index as the first group is for the orphans
                result.groups[foundIndex] = result.groups[foundIndex] || createGroup(haGroupData, [], config[foundIndex]);
                result.groups[foundIndex].batteryIds.push(id);
            }
        });
    }

    // update group name and secondary info / replace keywords with values
    result.groups.forEach(g => {
        if (g.title) {
            g.title = getEnrichedText(g.title, g, batteries);
        }

        if (g.secondaryInfo) {
            g.secondaryInfo = getEnrichedText(g.secondaryInfo, g, batteries);
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
const getGroupIndex = (config: ICollapsingGroupConfig[], battery: IBatteryCollectionItem, haGroupData: IGroupDataMap): number => {
    return config.findIndex(group => {

        if (group.group_id && !haGroupData[group.group_id]?.entity_id?.some(id => battery.entityId == id)) {
            return false;
        }

        if (group.entities && !group.entities.some(id => battery.entityId == id)) {
            return false
        }

        const level = isNaN(Number(battery.state)) ? 0 : Number(battery.state);

        return level >= group.min! && level <= group.max!;
    });
}

/**
 * Sets missing max/min fields.
 * @param config Collapsing groups config
 */
var populateMinMaxFields = (config: ICollapsingGroupConfig[]): void => config.forEach(groupConfig => {
    if (groupConfig.min == undefined) {
        groupConfig.min = 0;
    }

    if (groupConfig.max != undefined && groupConfig.max < groupConfig.min) {
        log("Collapse group min value should be lower than max.\n" + JSON.stringify(groupConfig, null, 2));
        return;
    }

    if (groupConfig.max == undefined) {
        groupConfig.max = 100;
    }
});

/**
 * Creates and returns group view data object.
 * @param haGroupData Home assistant group data
 * @param batteries Batterry view model
 * @param config Collapsing group config
 */
const createGroup = (haGroupData: IGroupDataMap, batteryIds: string[], config?: ICollapsingGroupConfig): IBatteryGroup => {

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
        title: name,
        icon: icon,
        batteryIds: batteryIds,
        secondaryInfo: config?.secondary_info
    }
}

/**
 * Replaces all keywords, used in the text, with values
 * @param text Text to process
 * @param group Battery group view data
 */
const getEnrichedText = (text: string, group: IBatteryGroup, batteries: IBatteryCollection): string => {
    text = text.replace(/\{[a-z]+\}/g, keyword => {
        switch (keyword) {
            case "{min}":
                return group.batteryIds.reduce((agg, id) => agg > Number(batteries[id].state) ? Number(batteries[id].state) : agg, 100).toString();
            case "{max}":
                return group.batteryIds.reduce((agg, id) => agg < Number(batteries[id].state) ? Number(batteries[id].state) : agg, 0).toString();
            case "{count}":
                return group.batteryIds.length.toString();
            case "{range}":
                const min = group.batteryIds.reduce((agg, id) => agg > Number(batteries[id].state) ? Number(batteries[id].state) : agg, 100).toString();
                const max = group.batteryIds.reduce((agg, id) => agg < Number(batteries[id].state) ? Number(batteries[id].state) : agg, 0).toString();
                return min == max ? min : min + "-" + max;
            default:
                return keyword;
        }
    });

    return text;
}