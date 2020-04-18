
export interface IBatteryEntity {
    entity: string;
    name?: string;
    attribute?: string;
    multiplier?: number;
}

export interface IAppearance {
    good_color?: string;
    warrning_color?: string;
    warrning_level?: number;
    critical_color?: string;
    critical_level?: number;
}

export interface IBatteryStateCardConfig extends IBatteryEntity, IAppearance  {
    entities: IBatteryEntity[],
}