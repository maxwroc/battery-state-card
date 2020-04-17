
export interface IBatteryEntity {
    entity: string;
    name?: string;
    attribute?: string;
    multiplier?: number;
}

export interface IBatteryViewData {
    name: string;
    level: number;
}

export interface IBatteryEntity {
    entity: string;
    name?: string;
    attribute?: string;
    multiplier?: number;
}

export interface IBatteryStateCardConfig {
    name?: string;
    entities?: string[] | IBatteryEntity[];
    entity?: IBatteryEntity
}