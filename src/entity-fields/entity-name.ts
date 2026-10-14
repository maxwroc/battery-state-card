import { HomeAssistantExt } from "../type-extensions";

/**
 * `hass.formatEntityName` only accepts a card's `name` option (a user string, a
 * structured name, or undefined) from HA 2026.4. Earlier versions expose the same
 * helper with an incompatible signature - bare type strings in 2025.10, and only
 * structured items between 2025.11 and 2026.3 - so feature detection is not
 * enough and the version has to be checked.
 */
const supportsEntityNames = (hass: HomeAssistantExt | undefined): boolean => {
  // A hass can report a recent version without carrying the helper (a test
  // harness, or a hass that has not finished initialising), and calling it
  // then throws - so the version gate alone is not enough.
  if (!hass || typeof (hass as { formatEntityName?: unknown }).formatEntityName !== 'function') {
    return false;
  }
    const [major, minor] = ((hass as any)?.config?.version ?? "").split(".", 2);
    return Number(major) > 2026 || (Number(major) === 2026 && Number(minor) >= 4);
};

/**
 * Resolves a `name` option against the entity's registry context (entity,
 * device, area, floor). Falls back to the friendly name on Home Assistant
 * versions that cannot resolve a structured name.
 */
export const computeEntityName = (
    hass: HomeAssistantExt | undefined,
    stateObj: { attributes?: IMap<any> } | undefined,
    name: EntityName | undefined,
): string | undefined => {
    // A string name is the override, exactly as formatEntityName treats it.
    // A configured empty name has always meant "use Home Assistant's name", but
    // formatEntityName returns any string verbatim - including the empty one, which
    // would blank the label. Normalise it to undefined so the formatter composes.
    if (name === "") name = undefined;

    if (typeof name === "string") return name;
    if (!stateObj) return undefined;
    if (hass && supportsEntityNames(hass)) {
        return (hass as any).formatEntityName(stateObj, name) || undefined;
    }
    // A structured name cannot be resolved here, so fall back to the friendly name.
    return stateObj.attributes?.friendly_name;
};
