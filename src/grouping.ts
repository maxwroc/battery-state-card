import { log } from "./utils";
import { IBatteryCollection, IBatteryCollectionItem } from "./battery-provider";
import { BatteryStateEntity } from "./custom-elements/battery-state-entity";

export interface IBatteryGroup {
    title?: string;
    secondaryInfo?: string;
    icon?: string;
    iconColor?: string;
    batteryIds: string[];
}

export interface IBatteryGroupResult {
    list: string[];
    groups: IBatteryGroup[];
}

/**
 * Returns battery collections to render
 */
export const getBatteryGroups = (batteries: IBatteryCollection, sortedIds: string[], config: number | IGroupConfig[] | undefined, haGroupData: IGroupDataMap): IBatteryGroupResult => {
    const result: IBatteryGroupResult = {
        list: [],
        groups: []
    };

    if (!config) {
        result.list = sortedIds;
        return result;
    }

    if (typeof config == "number") {
        result.list = sortedIds.slice(0, config);
        const remainingBatteries = sortedIds.slice(config);
        if (remainingBatteries.length > 0) {
            result.groups.push(createGroup(haGroupData, remainingBatteries));
        }
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

    // do the post processing for dynamic values which depend on the group items
    result.groups.forEach(g => {
        if (g.title) {
            g.title = getEnrichedText(g.title, g, batteries);
        }

        if (g.secondaryInfo) {
            g.secondaryInfo = getEnrichedText(g.secondaryInfo, g, batteries);
        }

        g.icon = getIcon(g.icon, g.batteryIds, batteries);
        g.iconColor = getIconColor(g.iconColor, g.batteryIds, batteries);
    });

    return result;
}

/**
 * Returns group index to which battery should be assigned.
 * @param config Collapsing groups config
 * @param battery Batterry view model
 * @param haGroupData Home assistant group data
 */
const getGroupIndex = (config: IGroupConfig[], battery: IBatteryCollectionItem, haGroupData: IGroupDataMap): number => {
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
var populateMinMaxFields = (config: IGroupConfig[]): void => config.forEach(groupConfig => {
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
const createGroup = (haGroupData: IGroupDataMap, batteryIds: string[], config?: IGroupConfig): IBatteryGroup => {

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
        iconColor: config?.icon_color,
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

const getIcon = (icon: string | undefined, batteryIdsInGroup: string[], batteries: IBatteryCollection): string | undefined => {
    switch (icon) {
        case "first":
            if (batteryIdsInGroup.length > 0) {
                icon = batteries[batteryIdsInGroup[0]].icon;
            }
            else {
                icon = undefined;
            }
            break;
        case "last":
            if (batteryIdsInGroup.length > 0) {
                const lastIndex = batteryIdsInGroup.length - 1;
                icon = batteries[batteryIdsInGroup[lastIndex]].icon;
            }
            else {
                icon = undefined;
            }
            break;
    }

    return icon;
}

const getIconColor = (iconColor: string | undefined, batteryIdsInGroup: string[], batteries: IBatteryCollection): string | undefined => {
    switch (iconColor) {
        case "first":
            if (batteryIdsInGroup.length > 0) {
                iconColor = batteries[batteryIdsInGroup[0]].iconColor;
            }
            else {
                iconColor = undefined;
            }
            break;
        case "last":
            if (batteryIdsInGroup.length > 0) {
                const lastIndex = batteryIdsInGroup.length - 1;
                iconColor = batteries[batteryIdsInGroup[lastIndex]].iconColor;
            }
            else {
                iconColor = undefined;
            }
            break;
    }

    return iconColor;
}