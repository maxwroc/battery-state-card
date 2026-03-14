import { HomeAssistant, Theme, Themes } from "custom-card-helpers";

/**
 * https://github.com/home-assistant/frontend/blob/dev/src/types.ts
 */
export interface HomeAssistantExt extends Omit<HomeAssistant, 'themes'> {
  entities: { [id: string]: EntityRegistryEntry };
  devices: { [id: string]: DeviceRegistryEntry };
  areas: { [id: string]: AreaRegistryEntry };

  themes: ThemesExt;

  formatEntityState(stateObj: any, state?: string): string;
  formatEntityAttributeValue(
    stateObj: any,
    attribute: string,
    value?: any
  ): string;
  formatEntityAttributeName(stateObj: any, attribute: string): string;
}

export interface ThemesExt extends Omit<Themes, 'themes'> {
  /**
   * Whether dark mode is set
   */
  darkMode: boolean;
  /**
   * Default dark theme set in Home Assistant
   */
  default_dark_theme: string;
  /**
   * Current theme set in Home Assistant
   */
  theme: string;

  themes: {
    [theme_name: string]: ThemeExt;
  } | ThemeMode;
}

interface ThemeMode {
  modes: { light: ThemeExt; dark: ThemeExt };
}

export interface ThemeExt extends Theme {
  [key: string]: string;
}

type entityCategory = "config" | "diagnostic";

export interface EntityRegistryEntry {
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

export interface AreaRegistryEntry {
  area_id: string;
  name: string;
  picture: string | null;
  aliases: string[];
}