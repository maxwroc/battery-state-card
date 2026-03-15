import { getThemeStyles } from "../../src/utils";

describe("Theme support", () => {
    it("should return undefined when hass is undefined", () => {
        const result = getThemeStyles(undefined, "waves");
        expect(result).toBeUndefined();
    });

    it("should return undefined when theme name is undefined", () => {
        const hass = { themes: { themes: {} } };
        const result = getThemeStyles(hass, undefined);
        expect(result).toBeUndefined();
    });

    it("should return undefined when theme doesn't exist", () => {
        const hass = {
            themes: {
                themes: {
                    "slate": { "--primary-color": "#ff0000" }
                }
            }
        };
        const result = getThemeStyles(hass, "waves");
        expect(result).toBeUndefined();
    });

    it("should convert theme properties to CSS variables", () => {
        const hass = {
            themes: {
                themes: {
                    "waves": {
                        "primary-color": "#0288D1",
                        "accent-color": "#0288D1",
                        "--custom-var": "#ffffff"
                    }
                }
            }
        };
        const result = getThemeStyles(hass, "waves");
        expect(result).toBeDefined();
        expect(result).toContain("--primary-color: #0288D1");
        expect(result).toContain("--accent-color: #0288D1");
        expect(result).toContain("--custom-var: #ffffff");
    });

    it("should handle themes with many CSS variables", () => {
        const hass = {
            themes: {
                themes: {
                    "slate": {
                        "primary-color": "#2196F3",
                        "text-primary-color": "#FFFFFF",
                        "paper-card-background-color": "#1E1E1E",
                        "ha-card-background": "#1E1E1E",
                        "--disabled-text-color": "#6F6F6F"
                    }
                }
            }
        };
        const result = getThemeStyles(hass, "slate");
        expect(result).toBeDefined();
        expect(result).toContain("--primary-color: #2196F3");
        expect(result).toContain("--text-primary-color: #FFFFFF");
        expect(result).toContain("--paper-card-background-color: #1E1E1E");
        expect(result).toContain("--ha-card-background: #1E1E1E");
        expect(result).toContain("--disabled-text-color: #6F6F6F");
    });

    it("should handle themes with light mode when darkMode is false", () => {
        const hass = {
            themes: {
                darkMode: false,
                themes: {
                    "adaptive": {
                        modes: {
                            light: {
                                "primary-color": "#FF5722",
                                "text-primary-color": "#000000"
                            },
                            dark: {
                                "primary-color": "#2196F3",
                                "text-primary-color": "#FFFFFF"
                            }
                        }
                    }
                }
            }
        };
        const result = getThemeStyles(hass, "adaptive");
        expect(result).toBeDefined();
        expect(result).toContain("--primary-color: #FF5722");
        expect(result).toContain("--text-primary-color: #000000");
        expect(result).not.toContain("#2196F3");
        expect(result).not.toContain("#FFFFFF");
    });

    it("should handle themes with dark mode when darkMode is true", () => {
        const hass = {
            themes: {
                darkMode: true,
                themes: {
                    "adaptive": {
                        modes: {
                            light: {
                                "primary-color": "#FF5722",
                                "text-primary-color": "#000000"
                            },
                            dark: {
                                "primary-color": "#2196F3",
                                "text-primary-color": "#FFFFFF"
                            }
                        }
                    }
                }
            }
        };
        const result = getThemeStyles(hass, "adaptive");
        expect(result).toBeDefined();
        expect(result).toContain("--primary-color: #2196F3");
        expect(result).toContain("--text-primary-color: #FFFFFF");
        expect(result).not.toContain("#FF5722");
        expect(result).not.toContain("#000000");
    });

    it("should default to light mode when darkMode is not set", () => {
        const hass = {
            themes: {
                themes: {
                    "adaptive": {
                        modes: {
                            light: {
                                "primary-color": "#FF5722"
                            },
                            dark: {
                                "primary-color": "#2196F3"
                            }
                        }
                    }
                }
            }
        };
        const result = getThemeStyles(hass, "adaptive");
        expect(result).toBeDefined();
        expect(result).toContain("--primary-color: #FF5722");
        expect(result).not.toContain("#2196F3");
    });
});
