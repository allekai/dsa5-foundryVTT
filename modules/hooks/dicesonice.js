export default function() {
    Hooks.once('init', () => {
        game.dsa5.apps.DiceSoNiceCustomization = new DiceSoNiceCustomization()
    })


    Hooks.once('diceSoNiceReady', (dice3d, b, c, d) => {
        dice3d.addColorset({
            name: 'mu',
            description: 'DSA5.mu',
            category: 'DSA5.dies',
            foreground: '#FFFFFF',
            background: '#b3241a',
            edge: '#b3241a',
            outline: '#FFFFFF',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'kl',
            description: 'DSA5.kl',
            category: 'DSA5.dies',
            foreground: '#FFFFFF',
            background: '#8259a3',
            edge: '#8259a3',
            outline: '#FFFFFF',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'in',
            description: 'DSA5.in',
            category: 'DSA5.dies',
            foreground: '#FFFFFF',
            background: '#388834',
            edge: '#388834',
            outline: '#FFFFFF',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'ch',
            description: 'DSA5.ch',
            category: 'DSA5.dies',
            foreground: '#FFFFFF',
            background: '#0d0d0d',
            edge: '#0d0d0d',
            outline: '#FFFFFF',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'ff',
            description: 'DSA5.ff',
            category: 'DSA5.dies',
            foreground: '#000000',
            background: '#d5b467',
            edge: '#d5b467',
            outline: '#FFFFFF',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'ge',
            description: 'DSA5.ge',
            category: 'DSA5.dies',
            foreground: '#000000',
            background: '#688ec4',
            edge: '#688ec4',
            outline: '#FFFFFF',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'ko',
            description: 'DSA5.ko',
            category: 'DSA5.dies',
            foreground: '#000000',
            background: '#a3a3a3',
            edge: '#a3a3a3',
            outline: '#FFFFFF',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'kk',
            description: 'DSA5.kk',
            category: 'DSA5.dies',
            foreground: '#000000',
            background: '#d6a878',
            edge: '#d6a878',
            outline: '#FFFFFF',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'attack',
            description: 'DSA5.attack',
            category: 'DSA5.dies',
            foreground: '#FFFFFF',
            background: '#b3241a',
            edge: '#b3241a',
            outline: '#b3241a',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'dodge',
            description: 'DSA5.dodge',
            category: 'DSA5.dies',
            foreground: '#FFFFFF',
            background: '#388834',
            edge: '#388834',
            outline: '#FFFFFF',
            texture: 'none'
        });
        dice3d.addColorset({
            name: 'parry',
            description: 'DSA5.parry',
            category: 'DSA5.dies',
            foreground: '#FFFFFF',
            background: '#388834',
            edge: '#388834',
            outline: '#FFFFFF',
            texture: 'none'
        });

        import ("../../../../modules/dice-so-nice/Utils.js").then(module => {
            game.dsa5.apps.DiceSoNiceCustomization.initConfigs(module)
        })
    });
}

class DiceSoNiceCustomization extends Application {
    initConfigs(module) {
        this.labelColor = module.Utils.contrastOf(game.user.data.color)
        const colors = module.Utils.prepareColorsetList()
        this.choices = {}
        for (const [key, value] of Object.entries(colors)) {
            mergeObject(this.choices, value)
        }
        const otherKey = { damage: "black" }
        this.attrs = ["mu", "kl", "in", "ch", "ff", "ge", "ko", "kk", "attack", "dodge", "parry", "damage"]
        game.settings.registerMenu("dsa5", "dicesonicesettings", {
            name: "DiceSoNiceSettings",
            label: "DiceSoNice Settings",
            hint: game.i18n.localize("DSASETTINGS.dicesonicesettings"),
            type: DiceSoNiceForm,
            restricted: false
        })
        for (const attr of this.attrs) {
            game.settings.register("dsa5", `dice3d_${attr}`, {
                name: `CHAR.${attr.toUpperCase()}`,
                scope: "client",
                config: false,
                default: otherKey[attr] || attr,
                type: String
            });
            game.settings.register("dsa5", `dice3d_system_${attr}`, {
                name: `CHAR.${attr.toUpperCase()}`,
                scope: "client",
                config: false,
                default: "standard",
                type: String
            });
        }

    }

    getAttributeConfiguration(value) {
        if (game.modules.get("dice-so-nice") && game.modules.get("dice-so-nice").active) {
            return {
                colorset: game.settings.get("dsa5", `dice3d_${value}`),
            }

            /*{
                colorset: ,
            }
            return {
                colorset: game.settings.get("dsa5", `dice3d_${value}`),
                system: game.settings.get("dsa5", `dice3d_system_${value}`)
            }*/
        }
        return { colorset: value }
    }

    activateListeners(html) {
        super.activateListeners()
        html.find('[name="entryselection"]').change(async(ev) => {
            await game.settings.set("dsa5", `dice3d_${ev.currentTarget.dataset.attr}`, ev.currentTarget.value)
        })
        html.find('[name="systemselection"]').change(async(ev) => {
            await game.settings.set("dsa5", `dice3d_system_${ev.currentTarget.dataset.attr}`, ev.currentTarget.value)
        })
    }

    async getData(options) {
        const data = await super.getData(options);
        data.choices = this.choices
        data.systems = duplicate(game.dice3d.DiceFactory.systems)
        data.selections = {}
        for (const attr of this.attrs) {
            data.selections[attr] = {
                color: game.settings.get("dsa5", `dice3d_${attr}`),
                system: game.settings.get("dsa5", `dice3d_system_${attr}`)
            }
        }
        return data
    }

    static get defaultOptions() {
        const options = super.defaultOptions
        mergeObject(options, {
            template: 'systems/dsa5/templates/wizard/dicesonice-configuration.html',
            title: game.i18n.localize("DSASETTINGS.dicesonicesettings"),
            width: 600
        });
        return options
    }
}

class DiceSoNiceForm extends FormApplication {
    render() {
        game.dsa5.apps.DiceSoNiceCustomization.render(true)
    }
}