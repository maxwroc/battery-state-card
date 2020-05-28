import { IBatteryStateCardConfig, ICollapsingGroups } from "./types"
import BatteryViewModel from "./battery-vm"
import { log } from "./utils";
import * as views from "./views";

interface IGroupData extends ICollapsingGroups {
    max: number;
    batteries: BatteryViewModel[];
}


export const getRenderedGroups = (config: number | ICollapsingGroups[], batteries: BatteryViewModel[]): any[] => {
    const groupConfigs = typeof config == "number" || !config ? [] : config;

    let renderedViews: any[] = [];
    let groups: IGroupData[] = [];

    if (typeof config == "number") {
        groups.push(createGroup(batteries.slice(0, config)));
        groups.push(createGroup(batteries.slice(config)));
    }
    else {
        // make sure that max property is set for every group
        populateMaxFields(config);

        // dummy group for orphans (entities without groups)
        groups.push(createGroup([]));

        batteries.forEach(b => {
            const level = isNaN(Number(b.level)) ? 0 : Number(b.level);
            const foundIndex = config.findIndex(g => level >= g.min && level <= g.max!);
            if (foundIndex == -1) {
                // batteries without group should always go to the first one
                groups[0].batteries.push(b);
            }
            else {
                // bumping group index as the first group is for the orphans
                const groupIndex = foundIndex + 1;
                groups[groupIndex] = groups[groupIndex] || createGroup([], config[foundIndex]);
                groups[groupIndex].batteries.push(b);
            }
        });
    }

    groups.forEach((group, i) => {
        const batteryViews = group.batteries.map(battery => views.battery(battery));
        if (i == 0) {
            // first group not collapsed
            renderedViews = batteryViews;
            return;
        }

        if (group.batteries.length == 0 && !group.always_show) {
            // skip empty groups
            return;
        }

        renderedViews.push(views.collapsableWrapper(batteryViews, getGroupTitle(group)))
    });

    return renderedViews;
}

var populateMaxFields = (config: ICollapsingGroups[]): void => config
    .sort((a, b) => a.min - a.min)
    .forEach((g, i) => {
        if (g.max != undefined && g.max < g.min) {
            log("Collapse group min value should be smaller than max.");
            return;
        }

        if (g.max == undefined) {
            g.max = config[i + 1] ? config[i + 1].min - 1 : 100;
        }
    });

const createGroup = (batteries: BatteryViewModel[], config?: ICollapsingGroups): IGroupData => {
    return {
        name: config?.name,
        min: config?.min || 0,
        max: config?.max || 100,
        always_show: config?.always_show,
        batteries: batteries,
    }
}

const getGroupTitle = (group: IGroupData): string => {
    let result = group.name || "";

    result = result.replace(/\{[a-z]+\}/g, keyword => {
        switch (keyword) {
            case "{min}":
                return group.batteries.reduce((agg, b) => agg > Number(b.level) ? Number(b.level) : agg, 100).toString();
            case "{max}":
                return group.batteries.reduce((agg, b) => agg < Number(b.level) ? Number(b.level) : agg, 0).toString();
            case "{count}":
                return group.batteries.length.toString();
            default:
                return keyword;
        }
    });

    return result;
}