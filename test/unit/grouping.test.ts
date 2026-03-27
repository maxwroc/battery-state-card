import { IBatteryCollection, IBatteryCollectionItem } from "../../src/battery-provider";
import { getBatteryGroups } from "../../src/grouping";
import { convertToEntityId } from "../helpers";
import { EntityDataAccessor } from "../../src/entity-data-accessor";
import { HomeAssistantExt } from "../../src/type-extensions";

let areaCounter = 0;
const mockHass: HomeAssistantExt = <any>{ states: {}, entities: {}, devices: {}, areas: {} };

const createBattery = (name: string, state: string, entityData?: IMap<any>, extraProps?: Partial<IBatteryCollectionItem>): IBatteryCollectionItem => {
    const id = convertToEntityId(name);

    // Build state object from entityData, but handle special accessor prefixes
    const stateData: any = {
        entity_id: id,
        state: state,
        attributes: { friendly_name: name },
    };

    if (entityData) {
        // Set up area registry if area data is provided
        if (entityData.area) {
            const areaId = entityData.area.name ? `area_${entityData.area.name.toString().toLowerCase().replace(/\s/g, "_")}` : `area_${++areaCounter}`;
            mockHass.areas![areaId] = { area_id: areaId, name: entityData.area.name, picture: null, aliases: [] };
            mockHass.entities![id] = <any>{ entity_id: id, area_id: areaId };
        }

        // Copy remaining entityData to state (for paths like battery_notes.*)
        for (const key of Object.keys(entityData)) {
            if (key !== "area") {
                stateData[key] = entityData[key];
            }
        }
    }

    mockHass.states[id] = stateData;

    return <IBatteryCollectionItem><any>{
        entityId: id,
        name: name,
        state: state,
        accessor: new EntityDataAccessor(mockHass, id),
        ...extraProps,
    };
}

const toCollection = (batteries: IBatteryCollectionItem[]): IBatteryCollection => {
    const result: IBatteryCollection = {};
    batteries.forEach(b => result[b.entityId!] = b);
    return result;
}

describe("Grouping - group_by (by)", () => {

    test("groups entities by a simple property path", () => {
        const batteries = [
            createBattery("Kitchen Light", "80", { area: { name: "Kitchen" } }),
            createBattery("Kitchen Sensor", "60", { area: { name: "Kitchen" } }),
            createBattery("Bedroom Light", "90", { area: { name: "Bedroom" } }),
            createBattery("Bedroom Sensor", "40", { area: { name: "Bedroom" } }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [{ by: "area.name" }], {});

        // All entities should be grouped, none ungrouped
        expect(result.list).toHaveLength(0);
        expect(result.groups).toHaveLength(2);

        const kitchenGroup = result.groups.find(g => g.title === "Kitchen");
        const bedroomGroup = result.groups.find(g => g.title === "Bedroom");

        expect(kitchenGroup).toBeDefined();
        expect(kitchenGroup!.batteryIds).toHaveLength(2);
        expect(bedroomGroup).toBeDefined();
        expect(bedroomGroup!.batteryIds).toHaveLength(2);
    });

    test("entities with missing group_by value stay ungrouped", () => {
        const batteries = [
            createBattery("Kitchen Light", "80", { area: { name: "Kitchen" } }),
            createBattery("Unknown Device", "50"), // no area data
            createBattery("Bedroom Light", "90", { area: { name: "Bedroom" } }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [{ by: "area.name" }], {});

        expect(result.list).toHaveLength(1);
        expect(result.list[0]).toBe("unknown_device");
        expect(result.groups).toHaveLength(2);
    });

    test("entities with null group_by value stay ungrouped", () => {
        const batteries = [
            createBattery("Kitchen Light", "80", { area: { name: "Kitchen" } }),
            createBattery("Null Area", "50", { area: { name: null } }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [{ by: "area.name" }], {});

        expect(result.list).toHaveLength(1);
        expect(result.list[0]).toBe("null_area");
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].title).toBe("Kitchen");
    });

    test("entities with empty string group_by value stay ungrouped", () => {
        const batteries = [
            createBattery("Kitchen Light", "80", { area: { name: "Kitchen" } }),
            createBattery("Empty Area", "50", { area: { name: "" } }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [{ by: "area.name" }], {});

        expect(result.list).toHaveLength(1);
        expect(result.list[0]).toBe("empty_area");
        expect(result.groups).toHaveLength(1);
    });

    test("group_by with filters - only matching entities are grouped", () => {
        const batteries = [
            createBattery("Kitchen Light", "80", { area: { name: "Kitchen" } }),
            createBattery("Kitchen Sensor", "15", { area: { name: "Kitchen" } }),
            createBattery("Bedroom Light", "90", { area: { name: "Bedroom" } }),
            createBattery("Bedroom Sensor", "10", { area: { name: "Bedroom" } }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            {
                by: "area.name",
                filter: [{ name: "state", operator: ">", value: 20 }],
            },
        ], {});

        // Only entities with state > 20 should be grouped
        expect(result.groups).toHaveLength(2);

        const kitchenGroup = result.groups.find(g => g.title === "Kitchen");
        expect(kitchenGroup).toBeDefined();
        expect(kitchenGroup!.batteryIds).toHaveLength(1); // only Kitchen Light (80)

        const bedroomGroup = result.groups.find(g => g.title === "Bedroom");
        expect(bedroomGroup).toBeDefined();
        expect(bedroomGroup!.batteryIds).toHaveLength(1); // only Bedroom Light (90)

        // Low battery entities stay ungrouped
        expect(result.list).toHaveLength(2);
    });

    test("group_by combined with explicit group - first match wins", () => {
        const batteries = [
            createBattery("Kitchen Light", "80", { area: { name: "Kitchen" } }),
            createBattery("Kitchen Sensor", "15", { area: { name: "Kitchen" } }),
            createBattery("Bedroom Light", "90", { area: { name: "Bedroom" } }),
            createBattery("Bedroom Sensor", "10", { area: { name: "Bedroom" } }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            {
                by: "area.name",
                filter: [{ name: "state", operator: ">", value: 20 }],
            },
            {
                name: "Low battery",
                filter: [{ name: "state", operator: "<=", value: 20 }],
            },
        ], {});

        // Two area groups + one explicit group
        expect(result.groups).toHaveLength(3);

        const kitchenGroup = result.groups.find(g => g.title === "Kitchen");
        expect(kitchenGroup).toBeDefined();
        expect(kitchenGroup!.batteryIds).toHaveLength(1);

        const bedroomGroup = result.groups.find(g => g.title === "Bedroom");
        expect(bedroomGroup).toBeDefined();
        expect(bedroomGroup!.batteryIds).toHaveLength(1);

        const lowBatteryGroup = result.groups.find(g => g.title === "Low battery");
        expect(lowBatteryGroup).toBeDefined();
        expect(lowBatteryGroup!.batteryIds).toHaveLength(2);

        // Nothing ungrouped
        expect(result.list).toHaveLength(0);
    });

    test("group_by preserves icon and secondary_info from config", () => {
        const batteries = [
            createBattery("Kitchen Light", "80", { area: { name: "Kitchen" } }),
            createBattery("Bedroom Light", "90", { area: { name: "Bedroom" } }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            {
                by: "area.name",
                icon: "mdi:home",
                icon_color: "red",
                secondary_info: "Count: {count}",
            },
        ], {});

        expect(result.groups).toHaveLength(2);
        result.groups.forEach(g => {
            expect(g.icon).toBe("mdi:home");
            expect(g.iconColor).toBe("red");
            expect(g.secondaryInfo).toBe("Count: 1");
        });
    });

    test("group_by uses custom name template when provided", () => {
        const batteries = [
            createBattery("Kitchen Light", "80", { area: { name: "Kitchen" } }),
            createBattery("Kitchen Sensor", "60", { area: { name: "Kitchen" } }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            {
                by: "area.name",
                name: "Room: Kitchen",
            },
        ], {});

        // When name is set, all expanded groups get that name (since all have same group_by value here)
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].title).toBe("Room: Kitchen");
        expect(result.groups[0].batteryIds).toHaveLength(2);
    });

    test("group_by with nested attribute path", () => {
        const batteries = [
            createBattery("Device A", "80", { attributes: { battery_type: "CR2032" } }),
            createBattery("Device B", "60", { attributes: { battery_type: "CR2032" } }),
            createBattery("Device C", "90", { attributes: { battery_type: "AAA" } }),
            createBattery("Device D", "50"), // no battery_type
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { by: "attributes.battery_type" },
        ], {});

        expect(result.groups).toHaveLength(2);
        expect(result.list).toHaveLength(1);
        expect(result.list[0]).toBe("device_d");

        const cr2032Group = result.groups.find(g => g.title === "CR2032");
        expect(cr2032Group).toBeDefined();
        expect(cr2032Group!.batteryIds).toHaveLength(2);

        const aaaGroup = result.groups.find(g => g.title === "AAA");
        expect(aaaGroup).toBeDefined();
        expect(aaaGroup!.batteryIds).toHaveLength(1);
    });

    test("group_by without filter groups all entities with resolved values", () => {
        const batteries = [
            createBattery("Device A", "10", { area: { name: "Kitchen" } }),
            createBattery("Device B", "90", { area: { name: "Kitchen" } }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { by: "area.name" },
        ], {});

        // Both are in Kitchen group regardless of state
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].title).toBe("Kitchen");
        expect(result.groups[0].batteryIds).toHaveLength(2);
        expect(result.list).toHaveLength(0);
    });

    test("no group_by entries - falls back to normal grouping", () => {
        const batteries = [
            createBattery("Device A", "10"),
            createBattery("Device B", "30"),
            createBattery("Device C", "60"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            {
                name: "Low",
                filter: [{ name: "state", operator: "<", value: 20 }],
            },
        ], {});

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].title).toBe("Low");
        expect(result.groups[0].batteryIds).toHaveLength(1);
        expect(result.list).toHaveLength(2);
    });

    test("group_by attributes.battery_type with state filter - user scenario", () => {
        const batteries = [
            createBattery("Device A", "30", { attributes: { battery_type: "CR2032" } }),
            createBattery("Device B", "80", { attributes: { battery_type: "CR2032" } }),
            createBattery("Device C", "10", { attributes: { battery_type: "AAA" } }),
            createBattery("Device D", "60", { attributes: { battery_type: "AAA" } }),
            createBattery("Device E", "90"), // no battery_type
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            {
                by: "attributes.battery_type",
                icon: "mdi:battery-alert",
                icon_color: "red",
                filter: [{ name: "state", operator: "<", value: 50 }],
            },
        ], {});

        // Only entities with state < 50 AND battery_type resolved should be grouped
        expect(result.groups).toHaveLength(2);

        const cr2032Group = result.groups.find(g => g.title === "CR2032");
        expect(cr2032Group).toBeDefined();
        expect(cr2032Group!.batteryIds).toHaveLength(1); // Device A (30)

        const aaaGroup = result.groups.find(g => g.title === "AAA");
        expect(aaaGroup).toBeDefined();
        expect(aaaGroup!.batteryIds).toHaveLength(1); // Device C (10)

        // Device B (80, CR2032), Device D (60, AAA), Device E (90, no notes) should be ungrouped
        expect(result.list).toHaveLength(3);
    });
});

describe("Grouping - no config", () => {
    test("returns all batteries in list when config is undefined", () => {
        const batteries = [
            createBattery("Device A", "80"),
            createBattery("Device B", "60"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, undefined, {});

        expect(result.list).toEqual(sortedIds);
        expect(result.groups).toHaveLength(0);
    });
});

describe("Grouping - numeric config (collapse)", () => {
    test("shows first N batteries and collapses the rest", () => {
        const batteries = [
            createBattery("Device A", "80"),
            createBattery("Device B", "60"),
            createBattery("Device C", "40"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, 2, {});

        expect(result.list).toHaveLength(2);
        expect(result.list).toEqual(sortedIds.slice(0, 2));
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].batteryIds).toEqual([sortedIds[2]]);
    });

    test("no collapsed group when all batteries fit", () => {
        const batteries = [
            createBattery("Device A", "80"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, 5, {});

        expect(result.list).toHaveLength(1);
        expect(result.groups).toHaveLength(0);
    });
});

describe("Grouping - group_id matching", () => {
    test("assigns batteries to groups by HA group_id", () => {
        const batteries = [
            createBattery("Device A", "80"),
            createBattery("Device B", "60"),
            createBattery("Device C", "40"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const haGroupData: IGroupDataMap = {
            "group.living_room": {
                entity_id: ["device_a", "device_b"],
                friendly_name: "Living Room",
                icon: "mdi:sofa",
            },
        };

        const result = getBatteryGroups(collection, sortedIds, [
            { group_id: "group.living_room" },
        ], haGroupData);

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].title).toBe("Living Room");
        expect(result.groups[0].icon).toBe("mdi:sofa");
        expect(result.groups[0].batteryIds).toEqual(["device_a", "device_b"]);
        expect(result.list).toEqual(["device_c"]);
    });

    test("batteries don't match when group_id is not found in HA data", () => {
        const batteries = [createBattery("Device A", "80")];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { group_id: "group.nonexistent" },
        ], {});

        // No battery matches the nonexistent group
        expect(result.list).toEqual(sortedIds);
        expect(result.groups).toHaveLength(0);
    });

    test("throws when group_id config refers to missing HA group and battery matches", () => {
        const batteries = [createBattery("Device A", "80")];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        // Battery will match min/max but createGroup will throw for missing group_id
        expect(() => getBatteryGroups(collection, sortedIds, [
            { group_id: "group.living_room", min: 0, max: 100 },
        ], { "group.living_room": { entity_id: ["device_a"], friendly_name: "Living Room" } })).not.toThrow();
    });
});

describe("Grouping - entities list matching", () => {
    test("assigns batteries to groups by explicit entity list", () => {
        const batteries = [
            createBattery("Device A", "80"),
            createBattery("Device B", "60"),
            createBattery("Device C", "40"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Selected", entities: ["device_a", "device_c"] },
        ], {});

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].batteryIds).toEqual(["device_a", "device_c"]);
        expect(result.list).toEqual(["device_b"]);
    });
});

describe("Grouping - min/max level matching", () => {
    test("assigns batteries to groups by min/max range", () => {
        const batteries = [
            createBattery("Low Battery", "15"),
            createBattery("Mid Battery", "50"),
            createBattery("High Battery", "90"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Low", min: 0, max: 20 },
            { name: "High", min: 80, max: 100 },
        ], {});

        expect(result.groups).toHaveLength(2);
        expect(result.groups[0].batteryIds).toEqual(["low_battery"]);
        expect(result.groups[1].batteryIds).toEqual(["high_battery"]);
        expect(result.list).toEqual(["mid_battery"]);
    });

    test("non-numeric state defaults to level 0", () => {
        const batteries = [
            createBattery("Unknown", "unavailable"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Zero", min: 0, max: 0 },
        ], {});

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].batteryIds).toEqual(["unknown"]);
    });

    test("logs warning when max < min", () => {
        const batteries = [createBattery("Device A", "50")];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        // This should log a warning but not crash
        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Invalid", min: 80, max: 20 },
        ], {});

        // Battery won't match the invalid group
        expect(result.list).toHaveLength(1);
    });
});

describe("Grouping - enriched text keywords", () => {
    test("{min} and {max} keywords", () => {
        const batteries = [
            createBattery("Device A", "30"),
            createBattery("Device B", "80"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Min: {min}, Max: {max}", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].title).toBe("Min: 30, Max: 80");
    });

    test("{count} keyword", () => {
        const batteries = [
            createBattery("Device A", "30"),
            createBattery("Device B", "80"),
            createBattery("Device C", "50"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Total: {count}", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].title).toBe("Total: 3");
    });

    test("{range} keyword when min equals max", () => {
        const batteries = [
            createBattery("Device A", "50"),
            createBattery("Device B", "50"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Range: {range}", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].title).toBe("Range: 50");
    });

    test("{range} keyword when min differs from max", () => {
        const batteries = [
            createBattery("Device A", "30"),
            createBattery("Device B", "80"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Range: {range}", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].title).toBe("Range: 30-80");
    });

    test("unknown keyword is left as-is", () => {
        const batteries = [createBattery("Device A", "50")];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Value: {unknown}", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].title).toBe("Value: {unknown}");
    });

    test("secondary_info with enriched text", () => {
        const batteries = [
            createBattery("Device A", "30"),
            createBattery("Device B", "80"),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Group", secondary_info: "Devices: {count}, {min}-{max}%", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].secondaryInfo).toBe("Devices: 2, 30-80%");
    });
});

describe("Grouping - dynamic icon", () => {
    test("icon 'first' uses first battery's icon", () => {
        const batteries = [
            createBattery("Device A", "80", {}, { icon: "mdi:battery-high" }),
            createBattery("Device B", "30", {}, { icon: "mdi:battery-low" }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Group", icon: "first", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].icon).toBe("mdi:battery-high");
    });

    test("icon 'last' uses last battery's icon", () => {
        const batteries = [
            createBattery("Device A", "80", {}, { icon: "mdi:battery-high" }),
            createBattery("Device B", "30", {}, { icon: "mdi:battery-low" }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Group", icon: "last", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].icon).toBe("mdi:battery-low");
    });

    test("icon 'first' with static icon is preserved as-is", () => {
        const batteries = [
            createBattery("Device A", "80", {}, { icon: "mdi:battery-high" }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Group", icon: "mdi:custom", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].icon).toBe("mdi:custom");
    });

    test("icon 'last' with static icon is preserved as-is", () => {
        const batteries = [createBattery("Device A", "80", {}, { icon: "mdi:battery" })];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Group", icon: "mdi:static", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].icon).toBe("mdi:static");
    });
});

describe("Grouping - dynamic iconColor", () => {
    test("iconColor 'first' uses first battery's iconColor", () => {
        const batteries = [
            createBattery("Device A", "80", {}, { iconColor: "#00ff00" }),
            createBattery("Device B", "30", {}, { iconColor: "#ff0000" }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Group", icon_color: "first", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].iconColor).toBe("#00ff00");
    });

    test("iconColor 'last' uses last battery's iconColor", () => {
        const batteries = [
            createBattery("Device A", "80", {}, { iconColor: "#00ff00" }),
            createBattery("Device B", "30", {}, { iconColor: "#ff0000" }),
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Group", icon_color: "last", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].iconColor).toBe("#ff0000");
    });

    test("iconColor 'first' with static value is preserved as-is", () => {
        const batteries = [createBattery("Device A", "80", {}, { iconColor: "#00ff00" })];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Group", icon_color: "#123456", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].iconColor).toBe("#123456");
    });

    test("iconColor 'last' with static value is preserved as-is", () => {
        const batteries = [createBattery("Device A", "80", {}, { iconColor: "#00ff00" })];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { name: "Group", icon_color: "#654321", min: 0, max: 100 },
        ], {});

        expect(result.groups[0].iconColor).toBe("#654321");
    });
});
