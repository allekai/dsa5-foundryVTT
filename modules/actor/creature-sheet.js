import DSA5_Utility from "../system/utility-dsa5.js";
import DSA5 from "../system/config-dsa5.js"
import ActorSheetDsa5 from "./actor-sheet.js";


export default class ActorSheetdsa5Creature extends ActorSheetDsa5 {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat(["dsa5", "actor", "creature-sheet"]),
            width: 680,
            height: 740,
        });
        return options;
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/dsa5/templates/actors/creature-limited.html";
        return "systems/dsa5/templates/actors/creature-sheet.html";

    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.ch-rollCombatTrait').click(event => {
            event.preventDefault();
            let itemId = this._getItemId(event);
            const item = this.actor.items.find(i => i.data._id == itemId)
            this.actor.setupWeaponTrait(item, "attack", event).then(setupData => {
                this.actor.basicTest(setupData)
            });
        });

        html.find('.ch-rollDamageTrait').click(event => {
            event.preventDefault();
            let itemId = this._getItemId(event);
            const item = this.actor.items.find(i => i.data._id == itemId)
            this.actor.setupWeaponTrait(item, "damage", event).then(setupData => {
                this.actor.basicTest(setupData)
            });
        });
    }

    async getData() {
        const data = super.getData();

        data["sizeCategories"] = DSA5.sizeCategories

        return data;
    }

    async _onDrop(event) {
        let dragData = JSON.parse(event.dataTransfer.getData("text/plain"));
        let item
        let typeClass

        if (dragData.actorId && dragData.actorId == this.actor.data._id) {
            return
        } else if (dragData.id && dragData.pack) {
            item = await DSA5_Utility.findItembyIdAndPack(dragData.id, dragData.pack);
            typeClass = item.data.type
        } else if (dragData.id) {
            item = DSA5_Utility.findItembyId(dragData.id);
            typeClass = item.data.type
        } else {
            item = dragData.data
            typeClass = item.type
        }

        switch (typeClass) {
            case "trait":
                await this.actor.createEmbeddedEntity("OwnedItem", item);
                break;
            default:
                super._onDrop(event)
        }
    }

}