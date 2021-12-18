import { css, CSSResult, TemplateResult } from "lit"
import { IBatteryCard } from "../types";
import { LovelaceCard } from "./lovelace-card";
import styles from "./battery-state-card.css"
import { property } from "lit/decorators.js";
import { BatteryStateEntity } from "./battery-state-entity";
import { cardHtml } from "./battery-state-card.views";
import { HomeAssistant } from "custom-card-helpers";
import { BatteryProvider, IBatteryCollection, IBatteryCollectionItem } from "../battery-provider";
import { battery } from "../views";
import { getBatteryGroups, IBatteryGroup } from "../grouping";


export class BatteryStateCard extends LovelaceCard<IBatteryCard> {

    @property({attribute: false})
    public header: string | undefined;

    @property({attribute:false})
    public list: string[] = [];

    @property({attribute: false})
    public groups: IBatteryGroup[] = [];

    private batteryProvider: BatteryProvider;

    /**
     * Not sorted nor groupped batteries
     */
    public batteries: IBatteryCollection = {};

    static get styles(): CSSResult {
        return css(<any>[styles]);
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

        const indexes = getIdsOfSortedBatteries(this.config, this.batteries);

        const groupingResult = getBatteryGroups(this.batteries, indexes, this.config.collapse, this.batteryProvider.groupsData);

        this.list = groupingResult.list;
        this.groups = groupingResult.groups;

        // if (JSON.stringify(groups) != JSON.stringify(this.groups)) {
        //     this.groups = groups;
        // }
    }

    render(): TemplateResult<1> {
        return cardHtml(this);
    }

    /**
     * Gets the height of your card.
     *
     * Home Assistant uses this to automatically distribute all cards over
     * the available columns. One is equal 50px.
     */
     getCardSize() {
        let size = this.config.entities?.length || 1;

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
        return size + 1;
    }
}

const getIdsOfSortedBatteries = (config: IBatteryCard, batteries: IBatteryCollection): string[] => {
    let batteriesToSort = Object.keys(batteries).map(entityId => batteries[entityId]);
    switch (config.sort_by_level) {
        case "asc": 
            batteriesToSort = batteriesToSort.sort((a, b) => compareBatteries(a.state, b.state));
            break;
        case "desc":
            batteriesToSort = batteriesToSort.sort((a, b) => compareBatteries(b.state, a.state));
            break;
    }

    return batteriesToSort.map(b => b.entityId!);
} 

const compareBatteries = (a: string, b: string): number => {
    let aNum = Number(a);
    let bNum = Number(b);
    aNum = isNaN(aNum) ? -1 : aNum;
    bNum = isNaN(bNum) ? -1 : bNum;
    return aNum - bNum;
}