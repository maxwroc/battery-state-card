import { HomeAssistant } from "custom-card-helpers";
import { getRegexFromString, safeGetArray } from "../utils";
import { RichStringProcessor } from "../rich-string-processor";


/**
 * Battery name getter
 * @param config Entity config
 * @param hass HomeAssistant state object
 * @returns Battery name
 */
export const getName = (config: IBatteryEntityConfig, hass: HomeAssistant | undefined): string => {
    if (config.name) {
        const proc = new RichStringProcessor(hass, config.entity);
        return proc.process(config.name);
    }

    if (!hass) {
        return config.entity;
    }

    let name = hass.states[config.entity]?.attributes.friendly_name || config.entity;

    const renameRules = safeGetArray(config.bulk_rename)
    renameRules.forEach(r => {
        const regex = getRegexFromString(r.from);
        if (regex) {
            // create regexp after removing slashes
            name = name.replace(regex, r.to || "");
        }
        else {
            name = name.replace(r.from, r.to || "");
        }
    });

    return name;
}

