

interface IColorThreshold {
    value: number;
    color?: string;
}

export interface IBatteryEntity {
    entity: string;
    name?: string;
    attribute?: string;
    multiplier?: number;
    value_override?: number; // dev purposes only
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