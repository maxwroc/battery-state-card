import { HomeAssistantExt } from "./type-extensions";
import { RichStringProcessor } from "./rich-string-processor";

/**
 * Action configuration parameters
 */
export type ActionConfigParams = {
  entity?: string;
  tap_action?: NativeHomeAssistantActionConfig;
  hold_action?: NativeHomeAssistantActionConfig;
  double_tap_action?: NativeHomeAssistantActionConfig;
};


/**
 * Handles action by firing hass-action event
 * @param node Element to fire event on
 * @param config Action configuration
 * @param action Action type (tap, hold, double_tap)
 * @param hass Home Assistant instance
 * @param entityData Entity data for KString processing
 */
export const handleAction = async (
  node: HTMLElement,
  config: ActionConfigParams,
  action: string,
  hass?: HomeAssistantExt,
  entityData?: IMap<any>,
): Promise<void> => {
  // Process KString values in action config if hass is provided
  if (hass) {
    config = processActionConfig(config, hass, entityData);
  }

  fireEvent(node, "hass-action", { config, action });
};

/**
 * Process KString values in action configuration
 * @param config Action configuration to process
 * @param hass Home Assistant instance
 * @param entityData Entity data for KString processing
 * @returns Processed action configuration
 */
const processActionConfig = (
  config: ActionConfigParams,
  hass: HomeAssistantExt,
  entityData?: IMap<any>,
): ActionConfigParams => {
  const processor = new RichStringProcessor(hass, entityData);
  const processedConfig = { ...config };

  // Process each action type (tap_action, hold_action, double_tap_action)
  for (const actionType of ['tap_action', 'hold_action', 'double_tap_action'] as const) {
    const actionConfig = processedConfig[actionType];

    if (actionConfig && typeof actionConfig === 'object') {
      processedConfig[actionType] = processActionProperties(actionConfig, processor);
    }
  }

  return processedConfig;
};

/**
 * Process KString values in action properties
 * @param actionConfig Action configuration object
 * @param processor RichStringProcessor instance
 * @returns Processed action configuration
 */
const processActionProperties = (
  actionConfig: Extract<NativeHomeAssistantActionConfig, { action: string }>,
  processor: RichStringProcessor,
): NativeHomeAssistantActionConfig => {
  const processed = { ...actionConfig } as any;

  // Process string properties that may contain KString
  const stringProperties = ['navigation_path', 'url_path', 'service'] as const;
  for (const prop of stringProperties) {
    if (processed[prop] && typeof processed[prop] === 'string') {
      processed[prop] = processor.process(processed[prop]);
    }
  }

  // Process nested objects (service_data, data, target)
  const objectProperties = ['service_data', 'data', 'target'] as const;
  for (const prop of objectProperties) {
    if (processed[prop]) {
      processed[prop] = processObjectRecursively(processed[prop], processor);
    }
  }

  return processed;
};

/**
 * Recursively process KString values in an object
 * @param obj Object to process
 * @param processor RichStringProcessor instance
 * @returns Processed object
 */
const processObjectRecursively = (
  obj: any,
  processor: RichStringProcessor,
): any => {
  if (typeof obj === 'string') {
    return processor.process(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => processObjectRecursively(item, processor));
  }

  if (obj && typeof obj === 'object') {
    const processed: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        processed[key] = processObjectRecursively(obj[key], processor);
      }
    }
    return processed;
  }

  return obj;
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
