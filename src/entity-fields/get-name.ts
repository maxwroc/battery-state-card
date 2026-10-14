import { getRegexFromString, safeGetArray } from "../utils";
import { RichStringProcessor } from "../rich-string-processor";
import { EntityDataAccessor } from "../entity-data-accessor";
import { computeEntityName } from "./entity-name";


/**
 * Battery name getter
 * @param config Entity config
 * @returns Battery name
 */
export const getName = (config: IBatteryEntityConfig, accessor: EntityDataAccessor): string => {
    if (config.name) {
        // A structured name is resolved from the registry. Unlike a string it is
        // not a rich-string template, so it must not go through the processor -
        // that would walk the object and hand back something unusable.
        if (typeof config.name !== "string") {
            return computeEntityName(accessor.hass, accessor.state, config.name) || config.entity;
        }

        const proc = new RichStringProcessor(accessor);
        return proc.process(config.name);
    }

    // Resolve the entity's own name from its registry context rather than
    // reading friendly_name, so it matches what the built-in cards show.
    let name = computeEntityName(accessor.hass, accessor.state, undefined);

    // when we have failed to get the name we just return entity id
    if (!name) {
        return config.entity;
    }

    // assuming it is not IBulkRename
    let renameRules = <IConvert | IConvert[] | undefined>config.bulk_rename;

    let capitalizeFirstLetter = true;

    // testing if it's IBulkRename
    if (config.bulk_rename && !Array.isArray(config.bulk_rename) && (<IConvert>config.bulk_rename)?.from === undefined) {
        // we are assuming it is a IBulkRename config
        const bulkRename = <IBulkRename>config.bulk_rename;

        renameRules = bulkRename.rules;
        capitalizeFirstLetter = bulkRename.capitalize_first !== false;
    }

    name = applyRenames(name, renameRules);

    if (capitalizeFirstLetter && name !== "") {
        name = name[0].toLocaleUpperCase() + name.substring(1);
    }

    return name;
}

const applyRenames = (name: string, renameRules: IConvert | IConvert[] | undefined) => safeGetArray(renameRules).reduce((result, rule) => {
    const regex = getRegexFromString(rule.from);
    if (regex) {
        // create regexp after removing slashes
        result = result.replace(regex, rule.to || "");
    }
    else {
        result = result.replace(rule.from, rule.to || "");
    }

    return result;
}, name)