declare module "*.css";

/**
 * Color threshold
 */
 interface IColorSteps {
    /**
     * Value/threshold below which color should be applied
     */
    value?: number;

    /**
     * Color to be applied when value is below the threshold
     */
    color: string;
}

/**
 * Color settings
 */
interface IColorSettings {
    /**
     * Color steps
     */
    steps: ISimplifiedArray<IColorSteps>;
    /**
     * Whether to enable smooth color transition between steps
     */
    gradient?: boolean;
}

/**
 * Supported action names
 */
type SupportedActions = "more-info" | "call-service" | "navigate" | "url";

/**
 * Action configuration (tapping/clicking)
 */
interface IActionConfig {
    /**
     * Action to be performed
     */
    action: SupportedActions;

    /**
     * Navigation path (home assistant page url path)
     */
    navigation_path: string;

    /**
     * Url to navigate (external)
     */
    url_path: string;

    /**
     * Name of the service to call
     */
    service: string;

    /**
     * Data for the service call
     */
    service_data: any;
}

/**
 * Convert one value to another
 */
interface IConvert {
    /**
     * Value to look for
     */
    from: string;

    /**
     * Value replacement
     */
    to: string;

    /**
     * Entity state to display
     */
    display?: string;
}

interface IBulkRename {
    /**
     * Rules for replacing one value by other
     */
    rules?: IConvert | IConvert[];

    /**
     * Whether to capitalize first letter
     */
    capitalize_first?: boolean
}

/**
 * Attribute
 */
interface IAttribute {
    /**
     * Name
     */
    name: string;

    /**
     * Value
     */
    value: any;
}

interface IChargingState {
    /**
     * Entity ID to extract the charging state info (in case it is different than the base entity)
     */
    entity_id?: string;

    /**
     * Collection of states indicating that battery is charging
     */
    state?: string | string[];

    /**
     * Attribute to extract charging state info from
     */
    attribute?: IAttribute | IAttribute[];

    /**
     * Icon override for charging indication
     */
    icon?: string;

    /**
     * Color override for charging indication
     */
    color?: string;

    /**
     * Override for the text shown in secondary_info (when battery is charging)
     */
    secondary_info_text?: string;
}

/**
 * Filter group types
 */
type FilterGroups = "exclude" | "include";

/**
 * Supprted filter operators
 */
type FilterOperator = "exists" | "not_exists" | "=" | ">" | "<" | ">=" | "<=" | "contains" | "matches";

/**
 * Allowed filter value types
 */
type FilterValueType  = string | number | boolean | null | undefined;

/**
 * Filter object
 */
interface IFilter {
    /**
     * Name of the entity property or attribute (attributes has to be prefixed with "attributes.")
     */
    name: string;

    /**
     * Operator used to compare the values
     */
    operator?: FilterOperator;

    /**
     * Value to compare with the extracted one
     */
    value?: FilterValueType;
}

interface IBatteryEntityConfig {

    /**
     * Entity ID
     */
    entity: string;

    /**
     * Override for entity name / friendly_name
     */
    name?: string;

    /**
     * Icon override
     */
    icon?: string;

    /**
     * Attribute name to extract batterly level from
     */
    attribute?: string;

    /**
     * Multiplier for battery level (when not in 0-100 range)
     */
    multiplier?: number;

    /**
     * When specified it rounds the value to number of fractional digits
     */
    round?: number;

    /**
     * Action to be performed when entity is tapped/clicked
     */
    tap_action?: IActionConfig;

    /**
     * Collection of mappings for values (useful when state/level is not numeric)
     */
    state_map?: IConvert[];

    /**
     * Configuration for charging state indication
     */
    charging_state?: IChargingState;

    /**
     * (Testing purposes) Override for battery level value
     */
    value_override?: string | number;

    /**
     * Colors settings
     */
    colors?: IColorSettings;

    /**
     * What to display as secondary info
     */
    secondary_info?: string;

    /**
     * Rules for renaming entities/batteries
     */
    bulk_rename?: IConvert | IConvert[] | IBulkRename;

    /**
     * Override for unit shown next to the value
     */
    unit?: string;

    /**
     * Whether the entity is not a battery entity
     */
    non_battery_entity?: boolean;

    /**
     * Whether to allow HA to format the state value
     */
    default_state_formatting?: boolean;

    /**
     * Whether to add display/device/area data
     */
    extend_entity_data?: boolean,

    /**
     * Whether to print the debug output
     */
    debug?: string | boolean,

    /**
     * Whether to respect HA entity visibility setting
     */
    respect_visibility_setting?: boolean,
}

interface IBatteryCardConfig {
    /**
     * List of entities to show in the card
     */
    entities: ISimplifiedArray<IBatteryEntityConfig>;

    /**
     * Title of the card (header text)
     */
    title?: string;

    /**
     * Sort options
     */
    sort?: ISimplifiedArray<ISortOption>;

    /**
     * Collapse after given number of entities
     */
    collapse?: number | IGroupConfig[];

    /**
     * Filters for auto adding or removing entities
     */
    filter?: { [key in FilterGroups]: IFilter[] };
}

/**
 * Battery card root config
 */
interface IBatteryStateCardConfig extends IBatteryCardConfig, IBatteryEntityConfig  {

}

type SortByOption = "state" | "name";

interface ISortOption {
    by: SortByOption;
    desc?: boolean;
}

interface IHomeAssistantGroupProps {
    entity_id: string[];
    friendly_name?: string;
    icon?: string;
}

interface IGroupDataMap {
    [group_id: string]: IHomeAssistantGroupProps
}

interface IGroupConfig {
    name?: string;
    secondary_info?: string;
    group_id?: string;
    entities?: string[];
    icon?: string;
    icon_color?: string;
    min?: number;
    max?: number;
}

interface IAction {
    (evt: Event): void
}

interface IActionData {
    config: IActionConfig
    card: Node;
    entityId: string
}

interface IMap<T> {
    [key: string]: T;
}

type IObjectOrString<T> = T | string;
type ISimplifiedArray<T> = IObjectOrString<T> | IObjectOrString<T>[] | undefined;

interface HomeAssistantWindow extends Window {
    customCards: ICardInfo[] | undefined;
}

interface ICardInfo {
    type: string;
    name: string;
    description: string;
    preview?: boolean;
    documentationURL?: string;
}