import { HomeAssistant } from "custom-card-helpers";

/**
 * https://github.com/home-assistant/frontend/blob/dev/src/types.ts
 */
export interface HomeAssistantExt extends HomeAssistant {
  formatEntityState(stateObj: any, state?: string): string;
  formatEntityAttributeValue(
    stateObj: any,
    attribute: string,
    value?: any
  ): string;
  formatEntityAttributeName(stateObj: any, attribute: string): string;
}