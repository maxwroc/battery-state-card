export interface CardConfig {
    type: string;
    name?: string;
    show_warning?: boolean;
    show_error?: boolean;
    test_gui?: boolean;
    entities?: string[];
}