import DSA5SoundEffect from "../system/dsa-soundeffect.js";
import { showPatchViewer } from "../system/migrator.js"

export default function() {
    const redrawMasterMenu = () => {
        if (game.user.isGM) {
            game.dsa5.apps.gameMasterMenu.render()
        }
    }

    game.settings.register("dsa5", "meleeBotchTableEnabled", {
        name: "DSASETTINGS.meleeBotchTableEnabled",
        hint: "DSASETTINGS.meleeBotchTableEnabledHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    game.settings.register("dsa5", "rangeBotchTableEnabled", {
        name: "DSASETTINGS.rangeBotchTableEnabled",
        hint: "DSASETTINGS.rangeBotchTableEnabledHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    game.settings.register("dsa5", "defenseBotchTableEnabled", {
        name: "DSASETTINGS.defenseBotchTableEnabled",
        hint: "DSASETTINGS.defenseBotchTableEnabledHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    game.settings.register("dsa5", "higherDefense", {
        name: "DSASETTINGS.higherDefense",
        hint: "DSASETTINGS.higherDefenseHint",
        scope: "world",
        config: true,
        default: "0",
        type: String,
        choices: {
            "0": "0",
            "2": "+2",
            "4": "+4",
        }
    });
    game.settings.register("dsa5", "statusEffectCounterColor", {
        name: "DSASETTINGS.statusEffectCounterColor",
        hint: "DSASETTINGS.statusEffectCounterColorHint",
        scope: "client",
        config: true,
        default: "#FFFFFF",
        type: String
    });

    game.settings.register("dsa5", "migrationVersion", {
        name: "migrationVersion",
        hint: "migrationVersion",
        scope: "world",
        config: false,
        default: 12,
        type: Number
    })
    game.settings.register("dsa5", "firstTimeStart", {
        name: "firstTimeStart",
        hint: "firstTimeStart",
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    })
    game.settings.register("dsa5", "defaultConfigFinished", {
        name: "defaultConfigFinished",
        hint: "defaultConfigFinished",
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    })
    game.settings.register("dsa5", "tokenizerSetup", {
        name: "tokenizerSetup",
        hint: "tokenizerSetup",
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    })
    game.settings.register("dsa5", "diceSetup", {
        name: "diceSetup",
        hint: "diceSetup",
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    })
    game.settings.register("dsa5", "capQSat", {
        name: "DSASETTINGS.capQSat",
        hint: "DSASETTINGS.capQSatHint",
        scope: "world",
        config: true,
        default: 6,
        type: Number
    });

    game.settings.register("dsa5", "hideEffects", {
        name: "DSASETTINGS.hideEffects",
        hint: "DSASETTINGS.hideEffectsHint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("dsa5", "inventorySound", {
        name: "DSASETTINGS.inventorySound",
        hint: "DSASETTINGS.inventorySoundHint",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("dsa5", "talentModifierEnabled", {
        name: "DSASETTINGS.talentModifierEnabled",
        hint: "DSASETTINGS.talentModifierEnabledHint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "noConfirmationRoll", {
        name: "DSASETTINGS.noConfirmationRoll",
        hint: "DSASETTINGS.noConfirmationRollHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "lessRegeneration", {
        name: "DSASETTINGS.lessRegeneration",
        hint: "DSASETTINGS.lessRegenerationHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "limitCombatSpecAbs", {
        name: "DSASETTINGS.limitCombatSpecAbs",
        hint: "DSASETTINGS.limitCombatSpecAbsHint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("dsa5", "allowPhysicalDice", {
        name: "DSASETTINGS.allowPhysicalDice",
        hint: "DSASETTINGS.allowPhysicalDiceHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "hideOpposedDamage", {
        name: "DSASETTINGS.hideOpposedDamage",
        hint: "DSASETTINGS.hideOpposedDamageHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "playerCanEditSpellMacro", {
        name: "DSASETTINGS.playerCanEditSpellMacro",
        hint: "DSASETTINGS.playerCanEditSpellMacroHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "soundConfig", {
        name: "DSASETTINGS.soundConfig",
        hint: "DSASETTINGS.soundConfigHint",
        scope: "world",
        config: true,
        default: "",
        type: String,
        onChange: async() => { DSA5SoundEffect.loadSoundConfig() }
    });

    game.settings.registerMenu("dsa5", "changelog", {
        name: "Changelog",
        label: "Changelog",
        hint: game.i18n.localize("DSASETTINGS.changelog"),
        type: ChangelogForm,
        restricted: false
    })

    game.settings.register("dsa5", "breadcrumbs", {
        name: "DSASETTINGS.breadcrumbs",
        hint: "DSASETTINGS.breadcrumbsHint",
        scope: "client",
        config: false,
        default: "",
        type: String
    });

    game.settings.register("dsa5", "groupschips", {
        name: "DSASETTINGS.groupschips",
        hint: "DSASETTINGS.groupschips",
        scope: "world",
        config: false,
        default: "0/0",
        type: String,
        onChange: async() => { redrawMasterMenu() }
    });

    game.settings.register("dsa5", "expandChatModifierlist", {
        name: "DSASETTINGS.expandChatModifierlist",
        hint: "DSASETTINGS.expandChatModifierlistHint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "indexWorldItems", {
        name: "DSASETTINGS.indexWorldItems",
        hint: "DSASETTINGS.indexWorldItemsHint",
        scope: "client",
        config: false,
        default: true,
        type: Boolean
    });

    game.settings.register("dsa5", "sightAutomationEnabled", {
        name: "sightAutomationEnabled",
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "disableDidYouKnow", {
        name: "DSASETTINGS.disableDidYouKnow",
        hint: "DSASETTINGS.disableDidYouKnowHint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "scrollingFontsize", {
        name: "DSASETTINGS.scrollingFontsize",
        hint: "DSASETTINGS.scrollingFontsizeHint",
        scope: "client",
        config: true,
        default: 16,
        type: Number,
        range: {
            min: 6,
            max: 50,
            step: 1
        }
    });

    game.settings.register("dsa5", "armorAndWeaponDamage", {
        name: "DSASETTINGS.armorAndWeaponDamage",
        hint: "DSASETTINGS.armorAndWeaponDamageHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dsa5", "obfuscateTokenNames", {
        name: "DSASETTINGS.obfuscateTokenNames",
        hint: "DSASETTINGS.obfuscateTokenNamesHint",
        scope: "world",
        config: true,
        default: "0",
        type: String,
        choices: {
            "0": game.i18n.localize('no'),
            "1": game.i18n.localize('yes'),
            "2": game.i18n.localize('DSASETTINGS.rename'),
        }
    });

    game.settings.register("dsa5", "sightOptions", {
        name: "sightOptions",
        scope: "world",
        config: false,
        default: "0.5|0.7|0.85|0.95",
        type: String
    });

    game.settings.register("dsa5", "trackedActors", {
        name: "sightOptions",
        scope: "world",
        config: false,
        default: {},
        type: Object
    });
}

class ChangelogForm extends FormApplication {
    render() {
        showPatchViewer()
    }
}