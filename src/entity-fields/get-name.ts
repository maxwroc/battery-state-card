import { HomeAssistant } from "custom-card-helpers";
import { safeGetArray } from "../utils";


/**
 * Battery name getter
 * @param config Entity config
 * @param hass HomeAssistant state object
 * @returns Battery name
 */
export const getName = (config: IBatteryEntityConfig, hass: HomeAssistant | undefined): string => {
    if (config.name) {
        return config.name;
    }

    if (!hass) {
        return config.entity;
    }

    let name = hass.states[config.entity]?.attributes.friendly_name || config.entity;

    const renameRules = safeGetArray(config.bulk_rename)
    renameRules.forEach(r => {
        if (r.from[0] == "/" && r.from[r.from.length - 1] == "/") {
            // create regexp after removing slashes
            name = name.replace(new RegExp(r.from.substr(1, r.from.length - 2)), r.to || "");
        }
        else {
            name = name.replace(r.from, r.to || "");
        }
    });

    return name;
}