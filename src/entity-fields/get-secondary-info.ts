import { HomeAssistant } from "custom-card-helpers/dist/types";
import { RichStringProcessor } from "../rich-string-processor";
import { isNumber } from "../utils";

/**
 * Gets secondary info text
 * @param config Entity config
 * @param hass HomeAssistant state object
 * @param entidyData Entity data
 * @returns Secondary info text
 */
export const getSecondaryInfo = (config: IBatteryEntityConfig, hass: HomeAssistant | undefined, entityData: IMap<any> | undefined): string => {
    if (config.secondary_info) {
        const processor = new RichStringProcessor(hass, entityData);

        let result = processor.process(config.secondary_info);

        // we convert to Date in the next step where number conversion to date is valid too
        // although in such cases we want to return the number - not a date
        if (isNumber(result)) {
            return result;
        }

        const dateVal = Date.parse(result);
        // The RT tags will be converted to proper HA tags at the views layer
        return isNaN(dateVal) ? result : `<rt>${result}</rt>`;
    }

    return <any>null;
}