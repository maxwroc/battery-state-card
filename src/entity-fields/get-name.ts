import { HomeAssistant } from "custom-card-helpers";
import { getRegexFromString, safeGetArray } from "../utils";
import { RichStringProcessor } from "../rich-string-processor";


/**
 * Battery name getter
 * @param config Entity config
 * @param hass HomeAssistant state object
 * @returns Battery name
 */
export const getName = (config: IBatteryEntityConfig, hass: HomeAssistant | undefined, entityData: IMap<any> | undefined): string => {
    if (config.name) {
        const proc = new RichStringProcessor(hass, entityData);
        return proc.process(config.name);
    }

    if (!hass) {
        return config.entity;
    }

    let name = hass.states[config.entity]?.attributes.friendly_name;

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

    if (capitalizeFirstLetter) {
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