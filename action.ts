import { HomeAssistant } from "custom-card-helpers";
import { log } from "./utils";

// Compile regex once for better performance
const TEMPLATE_REGEX = /\[\[\[\s*(.*?)\s*\]\]\]/g;

interface TemplateContext {
    entity?: any;
    config: { entity: string };
}

/**
 * Renders JavaScript templates recursively in objects
 * Supports [[[ return expression ]]] syntax similar to button-card
 * @param obj Object to render templates in
 * @param context Context object with entity, config, etc.
 * @returns Object with rendered templates
 */
const renderTemplatesRecursive = (obj: any, context: TemplateContext): any => {
    if (typeof obj === 'string') {
        // Reset regex for reuse
        TEMPLATE_REGEX.lastIndex = 0;
        
        return obj.replace(TEMPLATE_REGEX, (match, expression) => {
            try {
                // Clean expression - remove 'return' if it's already there
                const cleanExpression = expression.trim();
                const finalExpression = cleanExpression.startsWith('return ') 
                    ? cleanExpression.substring(7) // Remove 'return ' 
                    : cleanExpression;
                
                // Create function with context variables
                const func = new Function('entity', 'config', 'return ' + finalExpression);
                const result = func(context.entity, context.config);
                return result !== undefined && result !== null ? String(result) : match;
            } catch (error) {
                log(`Template rendering failed for "${expression}": ${error}`, "warn");
                return match; // Return original template if error
            }
        });
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => renderTemplatesRecursive(item, context));
    }
    
    if (obj && typeof obj === 'object') {
        const rendered: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                rendered[key] = renderTemplatesRecursive(obj[key], context);
            }
        }
        return rendered;
    }
    
    return obj;
};

const nameToFuncMap: { [key: string]: (data: IActionData, hass: HomeAssistant) => void } = {

    "more-info": (data) => {
        const evt = <any>new Event('hass-more-info', { composed: true });
        evt.detail = { entityId: data.entityId };
        data.card.dispatchEvent(evt);
    },

    "navigate": (data) => {
        if (!data.config.navigation_path) {
            log("Missing 'navigation_path' for 'navigate' tap action");
            return;
        }

        window.history.pushState(null, "", data.config.navigation_path);
        const evt = <any>new Event("location-changed", { composed: true });
        evt.detail = { replace: false };
        window.dispatchEvent(evt);
    },

    "call-service": (data, hass) => {
        if (!data.config.service) {
            log("Missing 'service' for 'call-service' tap action");
            return;
        }

        const [domain, service] = data.config.service.split(".", 2);
        const serviceData = { ...data.config.service_data };
        hass.callService(domain, service, serviceData);
    },

    "url": data => {
        if (!data.config.url_path) {
            log("Missing 'url_path' for 'url' tap action");
            return;
        }

        window.location.href = data.config.url_path;
    },
    
    "fire-dom-event": (data, hass) => {
        // Get entity data for template context
        const entityState = hass?.states[data.entityId];
        if (!entityState) {
            log(`Entity ${data.entityId} not found for fire-dom-event template rendering`, "warn");
        }
        
        const templateContext: TemplateContext = {
            entity: entityState,
            config: { entity: data.entityId }
        };
        
        // Render all templates in the config recursively
        const renderedConfig = renderTemplatesRecursive(data.config, templateContext);
        
        // Fire ll-custom event like the official HA implementation
        const evt = new CustomEvent("ll-custom", {
            detail: renderedConfig,
            bubbles: true,
            composed: true
        });
        
        data.card.dispatchEvent(evt);
    }
}

export const handleAction = (data: IActionData, hass: HomeAssistant): void => {
    if (!data.config || data.config.action == <any>"none") {
        return;
    }

    if (!(data.config.action in nameToFuncMap)) {
        log("Unknown tap action type: " + data.config.action);
        return;
    }

    nameToFuncMap[data.config.action](data, hass);
}