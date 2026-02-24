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
export const getSecondaryInfo = (config: IBatteryEntityConfig, hass: HomeAssistant, entityData: IMap<any> | undefined): string => {
    if (config.secondary_info) {
        const processor = new RichStringProcessor(hass, entityData);

        let result = processor.process(config.secondary_info);

        // we convert to Date in the next step where number conversion to date is valid too
        // although in such cases we want to return the number - not a date
        if (isNumber(result)) {
            return result;
        }

        // Check if the string looks like a date before attempting to parse it
        // This prevents false positives like "Bedroom 2" being treated as dates
        // Common date patterns include: ISO dates (2022-02-07), times (10:30:00), datetimes (2022-02-07T10:30:00)
        const looksLikeDate = /\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}(:\d{2})?|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(result);

        if (looksLikeDate) {
            const dateVal = Date.parse(result);
            if (!isNaN(dateVal)) {
                // The RT tags will be converted to proper HA tags at the views layer
                return `<rt>${result}</rt>`;
            }
        }

        return result;
    }

    return <any>null;
}