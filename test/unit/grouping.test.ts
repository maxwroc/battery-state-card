import { IBatteryCollection, IBatteryCollectionItem } from "../../src/battery-provider";
import { getBatteryGroups } from "../../src/grouping";
import { convertoToEntityId } from "../helpers";

const createBattery = (name: string, state: string, entityData?: IMap<any>): IBatteryCollectionItem => {
    const id = convertoToEntityId(name);
    return <IBatteryCollectionItem><any>{
        entityId: id,
        name: name,
        state: state,
        entityData: {
            entity_id: id,
            state: state,
            attributes: { friendly_name: name },
            ...entityData,
        },
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
            createBattery("Device A", "80", { battery_notes: { attributes: { battery_type: "CR2032" } } }),
            createBattery("Device B", "60", { battery_notes: { attributes: { battery_type: "CR2032" } } }),
            createBattery("Device C", "90", { battery_notes: { attributes: { battery_type: "AAA" } } }),
            createBattery("Device D", "50"), // no battery_notes
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            { by: "battery_notes.attributes.battery_type" },
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

    test("group_by battery_notes.battery_type with state filter - user scenario", () => {
        const batteries = [
            createBattery("Device A", "30", { battery_notes: { battery_type: "CR2032" } }),
            createBattery("Device B", "80", { battery_notes: { battery_type: "CR2032" } }),
            createBattery("Device C", "10", { battery_notes: { battery_type: "AAA" } }),
            createBattery("Device D", "60", { battery_notes: { battery_type: "AAA" } }),
            createBattery("Device E", "90"), // no battery_notes
        ];
        const collection = toCollection(batteries);
        const sortedIds = batteries.map(b => b.entityId!);

        const result = getBatteryGroups(collection, sortedIds, [
            {
                by: "battery_notes.battery_type",
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
