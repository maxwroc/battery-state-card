import { css, CSSResult, html, TemplateResult } from "lit"
import { LovelaceCard } from "./lovelace-card";
import { property } from "lit/decorators.js";
import { cardHtml } from "./battery-state-card.views";
import { BatteryProvider, IBatteryCollection } from "../battery-provider";
import { getBatteryGroups, IBatteryGroup } from "../grouping";
import sharedStyles from "./shared.css"
import cardStyles from "./battery-state-card.css"
import { getIdsOfSortedBatteries } from "../sorting";
import { safeGetConfigArrayOfObjects } from "../utils";


/**
 * Battery Card element
 */
export class BatteryStateCard extends LovelaceCard<IBatteryCardConfig> {

    /**
     * Card title
     */
    @property({attribute: false})
    public header: string | undefined;

    /**
     * List of entity IDs to render (without group)
     */
    @property({attribute:false})
    public list: string[] = [];

    /**
     * List of groups (containing list of entity IDs to render)
     */
    @property({attribute: false})
    public groups: IBatteryGroup[] = [];

    /**
     * Battery elements generator class
     */
    private batteryProvider: BatteryProvider;

    /**
     * Battery elements (all known, not sorted nor grouped)
     */
    public batteries: IBatteryCollection = {};

    /**
     * Card CSS styles
     */
    static get styles(): CSSResult {
        return css(<any>[sharedStyles + cardStyles]);
    }

    async internalUpdate(configUpdated: boolean, hassUpdated: boolean) {

        if (this.batteryProvider == undefined || configUpdated) {
            this.batteryProvider = new BatteryProvider(this.config);
        }

        if (hassUpdated) {
            await this.batteryProvider.update(this.hass!);
        }

        this.header = this.config.title;

        this.batteries = this.batteryProvider.getBatteries();

        const indexes = getIdsOfSortedBatteries(this.config, this.batteries)
            // we don't want to have any batteries which are hidden
            .filter(id => !this.batteries[id].isHidden);

        const groupingResult = getBatteryGroups(this.batteries, indexes, this.config.collapse, this.batteryProvider.groupsData);

        // we want to avoid render triggering
        if (JSON.stringify(groupingResult.list) != JSON.stringify(this.list)) {
            this.list = groupingResult.list;
        }

        // we want to avoid render triggering
        if (JSON.stringify(groupingResult.groups) != JSON.stringify(this.groups)) {
             this.groups = groupingResult.groups;
        }
    }

    render(): TemplateResult<1> {
        if (this.list.length == 0 && this.groups.length == 0) {
            // if there are no entities to show we don't want to render anything
            return html``;
        }

        return cardHtml(this);
    }

    /**
     * Gets the height of your card.
     *
     * Home Assistant uses this to automatically distribute all cards over
     * the available columns. One is equal 50px.
     * 
     * Unfortunatelly this func is called only once when layout is being 
     * rendered thus in case of dynamic number of entities (based on filters) 
     * we cannot provide any reasonable estimation.
     */
     getCardSize() {
        let size = safeGetConfigArrayOfObjects(this.config.entities, "entity").length || 1;

        if (this.config.collapse) {
            if (typeof this.config.collapse == "number") {
                // +1 to account the expand button
                return this.config.collapse + 1;
            }
            else {
                return this.config.collapse.length + 1;
            }
        }

        // +1 to account header
        return size + 3;
    }
}