
console.info(
    '%c BATTERY-STATE-CARD %c 0.1.0 ',
    'color: white; background: forestgreen; font-weight: 700;',
    'color: forestgreen; background: white; font-weight: 700;',
);

/**
 * Logs message in developer console
 * @param message Message to log
 * @param level Message level/importance
 */
export const log = (message: string, level: "warn" | "error" = "warn") => {
    console[level]("[battery-state-card] " + message);
}