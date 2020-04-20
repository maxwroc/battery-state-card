
export interface IBatteryEntity {
    entity: string;
    name?: string;
    attribute?: string;
    multiplier?: number;
    value_override: number; // dev purposes only
}

export interface IAppearance {
    icon_colors: boolean;
    good_color?: string;
    warrning_color?: string;
    warrning_level?: number;
    critical_color?: string;
    critical_level?: number;
}

export interface IBatteryStateCardConfig extends IBatteryEntity, IAppearance  {
    entities: IBatteryEntity[];
    sort_by_level?: "asc" | "desc";
}