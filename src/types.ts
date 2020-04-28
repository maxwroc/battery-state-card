

interface IColorThreshold {
    value: number;
    color?: string;
}

export type SupportedActions = "more-info" | "call-service" | "navigate" | "url";

export interface IActionConfig {
    action: SupportedActions;
    navigation_path: string;
    url_path: string;
    service: string;
    service_data: any;
}

export interface IStateMap {
    from: string;
    to: number;
}

export interface IBatteryEntity {
    entity: string;
    name?: string;
    attribute?: string;
    multiplier?: number;
    tap_action?: IActionConfig;
    state_map?: IStateMap[];
    value_override?: string; // dev purposes only
}

export interface IAppearance {
    color_thresholds?: IColorThreshold[];
    color_gradient?: string[];
}

export interface IBatteryStateCardConfig extends IBatteryEntity, IAppearance  {
    entities: IBatteryEntity[];
    sort_by_level?: "asc" | "desc";
    collapse?: number;
}

