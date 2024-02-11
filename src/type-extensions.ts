import { HomeAssistant } from "custom-card-helpers";

/**
 * https://github.com/home-assistant/frontend/blob/dev/src/types.ts
 */
export interface HomeAssistantExt extends HomeAssistant {
  entities: { [id: string]: EntityRegistryDisplayEntry };
  devices: { [id: string]: DeviceRegistryEntry };
  areas: { [id: string]: AreaRegistryEntry };

  formatEntityState(stateObj: any, state?: string): string;
  formatEntityAttributeValue(
    stateObj: any,
    attribute: string,
    value?: any
  ): string;
  formatEntityAttributeName(stateObj: any, attribute: string): string;
}

type entityCategory = "config" | "diagnostic";

export interface EntityRegistryDisplayEntry {
  entity_id: string;
  name?: string;
  device_id?: string;
  area_id?: string;
  hidden?: boolean;
  entity_category?: entityCategory;
  translation_key?: string;
  platform?: string;
  display_precision?: number;
}

export interface DeviceRegistryEntry {
  id: string;
  config_entries: string[];
  connections: Array<[string, string]>;
  identifiers: Array<[string, string]>;
  manufacturer: string | null;
  model: string | null;
  name: string | null;
  sw_version: string | null;
  hw_version: string | null;
  serial_number: string | null;
  via_device_id: string | null;
  area_id: string | null;
  name_by_user: string | null;
  entry_type: "service" | null;
  disabled_by: "user" | "integration" | "config_entry" | null;
  configuration_url: string | null;
}

interface AreaRegistryEntry {
  area_id: string;
  name: string;
  picture: string | null;
  aliases: string[];
}