import { IBatteryCollection, IBatteryCollectionItem } from "../../src/battery-provider";
import { getIdsOfSortedBatteries } from "../../src/sorting";
import { convertoToEntityId } from "../helpers";

describe("Entity sorting", () => {

    test.each([
        [<SortByOption>"name", false, ["a_sensor", "b_sensor", "g_sensor", "m_sensor", "z_sensor"]],
        [<SortByOption>"name", true, ["z_sensor", "m_sensor", "g_sensor", "b_sensor", "a_sensor"]],
        [<SortByOption>"state", false, ["m_sensor", "g_sensor", "b_sensor", "a_sensor", "z_sensor"]],
        [<SortByOption>"state", true, ["z_sensor", "b_sensor", "a_sensor", "g_sensor", "m_sensor"]],
    ])("Sorting with single option", (sortyBy: SortByOption, desc: boolean, expectedOrder: string[]) => {

        const sortedIds = getIdsOfSortedBatteries({ entities: [], sort: [{ by: sortyBy, desc: desc }]}, convertToCollection(batteries));

        expect(sortedIds).toStrictEqual(expectedOrder);
    })

    test.each([
        [{ stateDesc: false, nameDesc: false }, ["m_sensor", "g_sensor", "a_sensor", "b_sensor", "z_sensor"]],
        [{ stateDesc: false, nameDesc: true }, ["m_sensor", "g_sensor", "b_sensor", "a_sensor", "z_sensor"]],
        [{ stateDesc: true, nameDesc: false }, ["z_sensor", "a_sensor", "b_sensor", "g_sensor", "m_sensor"]],
        [{ stateDesc: true, nameDesc: true }, ["z_sensor", "b_sensor", "a_sensor", "g_sensor", "m_sensor"]],
        [{ stateDesc: false, nameDesc: false, reverse: true }, ["a_sensor", "b_sensor", "g_sensor", "m_sensor", "z_sensor"]],
        [{ stateDesc: false, nameDesc: true, reverse: true }, ["z_sensor", "m_sensor", "g_sensor", "b_sensor", "a_sensor"]],
        [{ stateDesc: true, nameDesc: false, reverse: true }, ["a_sensor", "b_sensor", "g_sensor", "m_sensor", "z_sensor"]],
        [{ stateDesc: true, nameDesc: true, reverse: true }, ["z_sensor", "m_sensor", "g_sensor", "b_sensor", "a_sensor"]],
    ])("Sorting with multiple options", (opt: { nameDesc: boolean, stateDesc: boolean, reverse?: boolean }, expectedOrder: string[]) => {

        const sortOptions = <ISortOption[]>[
            {
                by: "state",
                desc: opt.stateDesc,
            },
            {
                by: "name",
                desc: opt.nameDesc,
            }
        ];

        if (opt.reverse) {
            sortOptions.reverse();
        }

        const sortedIds = getIdsOfSortedBatteries({ entities: [], sort: sortOptions}, convertToCollection(batteries));

        expect(sortedIds).toStrictEqual(expectedOrder);
    });

    

    test.each([
        ["name", ["a_sensor", "b_sensor", "g_sensor", "m_sensor", "z_sensor"]],
        [["name"], ["a_sensor", "b_sensor", "g_sensor", "m_sensor", "z_sensor"]],
        [["state"], ["m_sensor", "g_sensor", "b_sensor", "a_sensor", "z_sensor"]],
        [["state", "name"], ["m_sensor", "g_sensor", "a_sensor", "b_sensor", "z_sensor"]],
    ])("Sorting options as strings", (sort: ISimplifiedArray<ISortOption>, expectedOrder: string[]) => {

        const sortedIds = getIdsOfSortedBatteries({ entities: [], sort: sort }, convertToCollection(batteries));

        expect(sortedIds).toStrictEqual(expectedOrder);
    })
});

const createBattery = (name: string, state: string) => {
    const b = <IBatteryCollectionItem>{
        entityId: convertoToEntityId(name),
        name: name,
        state: state,
    }
    return b;
}

const batteries = [
    createBattery("Z Sensor", "80"),
    createBattery("B Sensor", "30"),
    createBattery("M Sensor", "10"),
    createBattery("A Sensor", "30"),
    createBattery("G Sensor", "20"),
];

const convertToCollection = (batteries: IBatteryCollectionItem[]) => batteries.reduce((r, b) => {
    r[b.entityId!] = b;
    return r;
}, <IBatteryCollection>{});