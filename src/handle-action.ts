/**
 * Action configuration parameters
 */
export type ActionConfigParams = {
  entity?: string;
  tap_action?: INativeHomeAssistantActionConfig;
  hold_action?: INativeHomeAssistantActionConfig;
  double_tap_action?: INativeHomeAssistantActionConfig;
};


/**
 * Handles action by firing hass-action event
 * @param node Element to fire event on
 * @param config Action configuration
 * @param action Action type (tap, hold, double_tap)
 */
export const handleAction = async (
  node: HTMLElement,
  config: ActionConfigParams,
  action: string,
): Promise<void> => {
  fireEvent(node, "hass-action", { config, action });
};

/**
 * Fires a custom event on the target element
 * @param node Target element to fire event on
 * @param type Event type/name
 * @param detail Event detail data
 * @param options Event options
 */
const fireEvent = <T = any>(
  node: HTMLElement,
  type: string,
  detail?: T,
  options?: {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
  }
): void => {
  const event = new Event(type, {
    bubbles: options?.bubbles ?? true,
    cancelable: options?.cancelable ?? true,
    composed: options?.composed ?? true,
  });

  (event as any).detail = detail;
  node.dispatchEvent(event);
};
