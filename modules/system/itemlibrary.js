import DSA5_Utility from "./utility-dsa5.js"
import ADVANCEDFILTERS from "./itemlibrary_advanced_filters.js"

//TODO merge existing index with advanced details
//TODO create index with getIndex(fields)

class SearchDocument {
    constructor(item, pack = {}) {
        let filterType = item.documentName || getProperty(item, "type")
        switch (item.documentName) {
            case 'Item':
                filterType = item.type
                break
            case 'Actor':
                filterType = item.data.type
                break
        }
        let data
        switch (filterType) {
            case "creature":
            case "npc":
            case "character":
                data = getProperty(item, "data.description.value")
                break
            case 'JournalEntry':
                data = getProperty(item, "data.content")
                break
            default:
                data = getProperty(item, "data.data.description.value")
        }

        this.document = {
            name: item.name,
            filterType,
            data: $("<div>").html(data).text(),
            id: item.id || item._id,
            visible: item.visible ? item.visible : true,
            compendium: item.compendium ? item.compendium.metadata.package : (pack.package || ""),
            pack: item.pack || (pack.package ? `${pack.package}.${pack.name}` : undefined),
            img: item.img
        }
    }

    get name() {
        return this.document.name
    }
    get data() {
        return this.document.data
    }
    get id() {
        return this.document.id
    }
    get itemType() {
        return this.document.filterType
    }

    async getItem() {
        if (this.document.compendium) {
            return await (await game.packs.get(this.document.pack)).getDocument(this.id)
        } else {
            switch (this.itemType) {
                case "character":
                case "creature":
                case "npc":
                    return game.actors.get(this.id)
                case "JournalEntry":
                    return game.journal.get(this.id)
                default:
                    return game.items.get(this.id)
            }
        }
    }

    hasPermission() {
        return this.document.visible
    }
    async render() {
        (await this.getItem()).sheet.render(true)
    }
    get compendium() {
        return this.document.compendium
    }
    get img() {
        if (this.itemType == 'JournalEntry') return "systems/dsa5/icons/categories/DSA-Auge.webp"

        return this.document.img
    }
}

class AdvancedSearchDocument extends SearchDocument {
    constructor(item, subcategory) {
        super(item)

        const attrs = ADVANCEDFILTERS[subcategory] || []
        for (let attr of attrs) {
            this[attr.attr] = attr.attr.split(".").reduce((prev, cure) => {
                return prev[cure]
            }, item.data.data)
        }
    }
}

export default class DSA5ItemLibrary extends Application {
    constructor(app) {
        super(app)
        this.advancedFiltering = false
        this.journalBuild = false
        this.journalWorldBuild = false
        this.equipmentBuild = false
        this.equipmentWorldBuild
        this.zooBuild = false
        this.zooWorldBuild = false
        this.currentDetailFilter = {
            equipment: [],
            character: [],
            spell: [],
            journal: [],
            zoo: []
        }
        this.journalIndex = new FlexSearch({
            encode: "simple",
            tokenize: "reverse",
            cache: true,
            doc: {
                id: "id",
                field: [
                    "name",
                    "data"
                ],
            }
        });
        this.equipmentIndex = new FlexSearch({
            encode: "simple",
            tokenize: "reverse",
            cache: true,
            doc: {
                id: "id",
                field: [
                    "name",
                    "data",
                    "itemType"
                ],
            }
        });
        this.zooIndex = new FlexSearch({
            encode: "simple",
            tokenize: "reverse",
            cache: true,
            doc: {
                id: "id",
                field: [
                    "name",
                    "data",
                    "itemType"
                ],
            }
        });

        this.detailFilter = {}

        this.pages = {
            equipment: {},
            character: {},
            spell: {},
            journal: {},
            zoo: {}
        }

        this.filters = {
            equipment: {
                categories: {
                    "armor": false,
                    "ammunition": false,
                    "equipment": false,
                    "meleeweapon": false,
                    "rangeweapon": false,
                    "poison": false,
                    "disease": false,
                    "consumable": false,
                    "plant": false
                },
                filterBy: {
                    search: ""
                }
            },
            character: {
                categories: {
                    "career": false,
                    "advantage": false,
                    "combatskill": false,
                    "culture": false,
                    "disadvantage": false,
                    "trait": false,
                    "skill": false,
                    "specialability": false,
                    "species": false,
                    "application": false
                },
                filterBy: {
                    search: ""
                }
            },
            spell: {
                categories: {
                    "blessing": false,
                    "ceremony": false,
                    "liturgy": false,
                    "magictrick": false,
                    "ritual": false,
                    "spell": false,
                    "spellextension": false,
                    "magicalsign": false
                },
                filterBy: {
                    search: ""
                }
            },
            journal: {
                categories: {},
                filterBy: {
                    search: ""
                }
            },
            zoo: {
                categories: {
                    "npc": false,
                    "character": false,
                    "creature": false
                },
                filterBy: {
                    search: ""
                }
            },

        }

    }

    async getData(options) {
        const data = await super.getData(options);
        data.categories = this.translateFilters()
        data.isGM = game.user.isGM
        data.items = this.items
        data.advancedMode = this.advancedFiltering ? "on" : ""
        data.worldIndexed = game.settings.get("dsa5", "indexWorldItems") ? "on" : ""
        if (this.advancedFiltering) {
            data.advancedFilter = await this.buildDetailFilter("tbd", this.subcategory)
        }
        return data
    }

    translateFilters() {
        return {
            equipment: this.buildFilter(this.filters.equipment),
            character: this.buildFilter(this.filters.character),
            spell: this.buildFilter(this.filters.spell),
            zoo: this.buildFilter(this.filters.zoo),
            journal: this.buildFilter(this.filters.journal)
        }
    }

    purgeAdvancedFilters() {
        for (let key in this.filters) {
            for (let subkey in this.filters[key]["categories"]) {
                this.filters[key]["categories"][subkey] = false
            }
        }
        $(this._element).find('.filter[type="checkbox"]').prop("checked", false)
        this.buildDetailFilter("none", "none").then(templ => {
            $(this._element).find('.advancedSearch .groupbox').html(templ)
        })
    }

    buildFilter(elem) {
        let res = []
        Object.keys(elem.categories).forEach(function(key) {
            res.push({ label: game.i18n.localize(key), selected: elem.categories[key], key: key })
        })
        res = res.sort(function(a, b) {
            return a.label.localeCompare(b.label);
        });
        return res
    }

    static get defaultOptions() {
        const options = super.defaultOptions
        options.id = "DSA5ItemLibrary"
        options.classes.push("dsa5", "itemlibrary")
        options.height = 800
        options.width = 800
        options.resizable = true
        options.title = game.i18n.localize("ItemLibrary")
        options.template = "systems/dsa5/templates/system/itemlibrary.html"
        options.tabs = [{ navSelector: ".tabs", contentSelector: ".content", initial: "equipment" }]
        return options
    }

    async getRandomItems(category, limit) {
        let filteredItems = []
        let index = this.equipmentIndex

        filteredItems.push(...(await index.search(category, { field: ["itemType"] })))
        return await Promise.all(this.shuffle(filteredItems.filter(x => x.hasPermission)).slice(0, limit).map(x => x.getItem()))
    }

    shuffle(array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    async findCompendiumItem(search, category, filterCompendium = true) {
        if (!this.equipmentBuild) {
            await this.buildEquipmentIndex()
        }
        let query = {
            field: ["name"],
            where: { itemType: category }
        }
        let result = await this.equipmentIndex.search(search, query)
        if (filterCompendium) result = result.filter(x => x.compendium != "")

        console.log(filterCompendium)

        return await Promise.all(result.map(x => x.getItem()))
    }

    async getCategoryItems(category, asItem = false) {
        await this.buildEquipmentIndex()
        if (asItem) return (await Promise.all(this.equipmentIndex.search(category, { field: ["itemType"] }).map(x => x.getItem()))).map(x => x.toObject())

        return this.equipmentIndex.search(category, { field: ["itemType"] })
    }

    async advancedFilterStuff(category, page) {
        const dataFilters = $(this._element).find('.detailFilters')
        const subcategory = dataFilters.attr("data-subc")
        let search = this.filters[category].filterBy.search.toLowerCase()
        let index = this.detailFilter[subcategory]

        const sels = []
        const inps = []
        for (let elem of dataFilters.find('select')) {
            let val = $(elem).val()
            if (val != "") {
                sels.push([$(elem).attr("name"), val])
            }
        }
        for (let elem of dataFilters.find('input:not(.manualFilter)')) {
            let val = $(elem).val()
            if (val != "") {
                inps.push([$(elem).attr("name"), val.toLowerCase()])
            }
        }

        const selFnct = (x) => {
            for (let k of sels) {
                if (x[k[0]] != k[1]) return false
            }
            return true
        }
        const txtFnct = (x) => {
            for (let k of inps) {
                if (x[k[0]].toLowerCase().indexOf(k[1]) == -1) return false
            }
            return true
        }

        let result = index.where(x => (search == "" || x.name.toLowerCase().indexOf(search) != -1) && selFnct(x) && txtFnct(x))

        //this.pages[category].next = result.length

        let filteredItems = result
        filteredItems = filteredItems.filter(x => x.hasPermission).sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1)
        this.setBGImage(filteredItems, category)

        return filteredItems
    }

    async filterStuff(category, index, page) {
        let search = this.filters[category].filterBy.search

        let fields = {
            field: ["name", "data"],
            limit: 60,
            page: page || true
        }
        let filteredItems = []

        let oneFilterSelected = false
        for (let filter in this.filters[category].categories) {
            if (this.filters[category].categories[filter]) {
                let result
                if (search == "") {
                    result = index.search(filter, { field: ["itemType"], limit: 60, page: page || true })
                } else {
                    let query = duplicate(fields)
                    mergeObject(query, { where: { itemType: filter } })
                    result = index.search(search, query)
                }
                this.pages[category].next = result.next
                filteredItems.push(...result.result)
            }
            oneFilterSelected = this.filters[category].categories[filter] || oneFilterSelected
        }

        if (!oneFilterSelected) {
            filteredItems = index.search(search, fields)
            this.pages[category].next = filteredItems.next
        }

        filteredItems = filteredItems.result ? filteredItems.result : filteredItems
        filteredItems = filteredItems.filter(x => x.hasPermission).sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1)
        this.setBGImage(filteredItems, category)

        return filteredItems
    }

    setBGImage(filterdItems, category) {
        $(this._element).find(`.${category} .libcontainer`)[`${filterdItems.length > 0 ? "remove" : "add"}Class`]("libraryImg")
    }

    renderResult(html, filteredItems, { index, itemType }, isPaged) {
        let resultField = html.find('.searchResult .item-list')
        renderTemplate('systems/dsa5/templates/system/libraryItem.html', { items: filteredItems }).then(innerhtml => {
            if (!isPaged) resultField.empty()

            innerhtml = $(innerhtml)
            innerhtml.each(function() {
                const li = $(this)
                li.attr("draggable", true).on("dragstart", event => {
                    let item = index.find($(li).attr("data-item-id"))
                    event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify({
                        type: itemType,
                        pack: item.compendium ? item.document.pack : "",
                        id: item.id
                    }))
                })
            })
            resultField.append(innerhtml)
        });
    }

    async filterItems(html, category, page) {
        const index = this.selectIndex(category)
        if (this.advancedFiltering && category != "journal") {
            const filteredItems = await this.advancedFilterStuff(category, page)
            this.renderResult(html, filteredItems, index, page)
            return filteredItems;
        } else {
            const filteredItems = await this.filterStuff(category, index.index, page)
            this.renderResult(html, filteredItems, index, page)
            return filteredItems;
        }
    }

    selectIndex(category) {
        let itemType = "Item"
        let index = this.equipmentIndex
        switch (category) {
            case "zoo":
                itemType = "Actor"
                index = this.zooIndex
                break
            case "journal":
                itemType = "JournalEntry"
                index = this.journalIndex
                break
        }
        return { index, itemType }
    }

    async _render(force = false, options = {}) {
        await super._render(force, options)
        this.buildEquipmentIndex()
    }

    async buildEquipmentIndex() {
        await this._createIndex("equipment", "Item", game.items)
    }

    async _createIndex(category, document, worldStuff) {
        if (this[`${category}Build`]) return

        const target = $(this._element).find(`*[data-tab="${category}"]`)
        this.showLoading(target, category)
        const packs = game.packs.filter(p => p.documentName == document && (game.user.isGM || !p.private))
        let promise
        let metadata = packs.map(p => p.metadata)
        if (document == "Actor") {
            const fields = ["name", "data.type", "data.description.value", "img"]
            promise = packs.map(p => p.getIndex({ fields }))
        } else if (document == "JournalEntry") {
            //const fields = ["name", "type", "data.content", "img"]
            //promise = packs.map(p => p.getIndex({ fields }))
            promise = packs.map(p => p.getDocuments())
        } else {
            //const fields = ["name", "type", "data.description.value", "img"]
            //promise = packs.map(p => p.getIndex({ fields }))
            promise = packs.map(p => p.getDocuments())
        }

        return Promise.all(promise).then(indexes => {
            const items = this.indexWorldItems(worldStuff, category)
            indexes.forEach((index, idx) => {
                items.push(...index.map(x => new SearchDocument(x, metadata[idx])))
            })
            this[`${category}Index`].add(items)
            this[`${category}Build`] = true
            this.hideLoading(target, category)
        })
    }

    subcategoryFields(subcategory) {
        let field = ["name", "itemType"]
        const attrs = ADVANCEDFILTERS[subcategory] || []
        for (let attr of attrs) {
            field.push(attr.attr)
        }
        return field
    }

    indexWorldItems(worldStuff, category) {
        const items = []
        if (game.settings.get("dsa5", "indexWorldItems")) {
            items.push(...worldStuff.filter(x => x.visible).map(x => new SearchDocument(x)))
            this[`${category}WorldBuild`] = true
        }
        return items
    }


    async createDetailIndex(category, subcategory) {
        if (!this.detailFilter[subcategory]) {
            const field = this.subcategoryFields(subcategory)
            const target = $(this._element).find(`*[data-tab="${category}"]`)
            target.find('.searchResult ul').html('')
            this.showLoading(target, category)
            this.detailFilter[subcategory] = new FlexSearch({
                encode: "simple",
                tokenize: "full",
                cache: true,
                doc: {
                    id: "id",
                    field
                }
            });

            const { index, itemType } = this.selectIndex(category)
            const worldStuff = itemType == "Item" ? game.items : game.actors
            let items = worldStuff.filter(x => x.visible && x.data.type == subcategory).map(x => new AdvancedSearchDocument(x, subcategory))

            const result = index.search(subcategory, { field: ["itemType"] })
            const pids = {}
            for (let res of result) {
                if (!res.document.pack) continue
                if (!pids[res.document.pack]) pids[res.document.pack] = []
                pids[res.document.pack].push(res.document.id)
            }
            const promises = []
            for (const key of Object.entries(pids)) {
                promises.push(game.packs.get(key[0]).getDocuments({ _id: { $in: key[1] }, type: subcategory }))
            }

            let final = await Promise.all(promises)
            for (let k of final) {
                items.push(...k.map(x => new AdvancedSearchDocument(x, subcategory)))
            }
            this.detailFilter[subcategory].add(items)
            this.hideLoading(target, category)
        }
    }

    async buildDetailFilter(category, subcategory) {
        const fields = ADVANCEDFILTERS[subcategory] || []

        if (fields) {
            let bindex = this.createDetailIndex(category, subcategory)
            const template = await renderTemplate("systems/dsa5/templates/system/detailFilter.html", { fields, subcategory })
            await bindex
            return template
        } else {
            return `<p>${game.i18n.localize('Library.selectAdvanced')}</p>`
        }
    }

    checkWorldStuffIndex() {
        if (game.settings.get("dsa5", "indexWorldItems")) {
            if (!this.journalWorldBuild && this.journalBuild) {
                this.journalIndex.add(this.indexWorldItems(game.journal, "journal"))
            }
            if (!this.equipmentWorldBuild && this.equipmentBuild) {
                this.equipmentIndex.add(this.indexWorldItems(game.items, "equipment"))
            }
            if (!this.zooWorldBuild && this.zooBuild) {
                this.zooIndex.add(this.indexWorldItems(game.actors, "zoo"))
            }
        }
    }

    activateListeners(html) {
        super.activateListeners(html)

        html.on("click", ".toggleAdvancedMode", () => {
            this.advancedFiltering = !this.advancedFiltering
            if (this.advancedFiltering) {
                $(this._element).find('.toggleAdvancedMode').addClass("on")
                $(this._element).find('.advancedSearch').fadeIn()
                this.purgeAdvancedFilters()
            } else {
                $(this._element).find('.toggleAdvancedMode').removeClass("on")
                $(this._element).find('.advancedSearch').fadeOut()
            }
        })

        html.on("change", ".detailFilters input, .detailFilters select", () => {
            const tab = $(this._element).find('.tab.active')
            const category = tab.attr("data-tab")
            this.filterItems(tab, category);
        })

        html.on("click", ".filter", async(ev) => {
            const tab = $(ev.currentTarget).closest('.tab')
            const category = tab.attr("data-tab")
            const subcategory = $(ev.currentTarget).attr("data-category")
            const isChecked = $(ev.currentTarget).is(":checked")
            if (this.advancedFiltering && isChecked) {
                this.purgeAdvancedFilters()
                this.subcategory = subcategory
                $(ev.currentTarget).prop("checked", isChecked)
                $(this._element).find('.advancedSearch .groupbox').html(await this.buildDetailFilter(category, subcategory))
            }
            this.filters[category].categories[subcategory] = isChecked
            this.filterItems(tab, category);
        })

        html.on("click", ".item-name", ev => {
            this.getItemFromHTML(ev).render()
        })

        html.on("mousedown", ".item-name", ev => {
            if (ev.button == 2) DSA5_Utility.showArtwork(this.getItemFromHTML(ev))
        })

        html.on("keyup", ".filterBy-search", ev => {
            const tab = $(ev.currentTarget).closest('.tab')
            const category = tab.attr("data-tab")
            this.filters[category].filterBy.search = $(ev.currentTarget).val();
            this.filterItems(tab, category);
        })

        html.find(`*[data-tab="journal"]`).click(x => {
            this._createIndex("journal", "JournalEntry", game.journal)
        })
        html.find(`*[data-tab="zoo"]`).click(x => {
            this._createIndex("zoo", "Actor", game.actors)
        })

        html.find('.showDetails').click(ev => {
            const tab = $(ev.currentTarget).attr("data-btn")
            $(ev.currentTarget).find('i').toggleClass("fa-caret-left fa-caret-right")
            html.find(`.${tab} .detailBox`).toggleClass("dsahidden")
        })

        html.find('.toggleWorldIndex').click(ev => {
            game.settings.set("dsa5", "indexWorldItems", !game.settings.get("dsa5", "indexWorldItems"))
            this.checkWorldStuffIndex()
            $(this._element).find('.toggleWorldIndex').toggleClass("on")
        })

        const source = this

        $(this._element).find('.window-content').on('scroll.infinit', debounce(function(ev) {
                if (source.advancedFiltering) return

                const log = $(ev.target);
                const pct = (log.scrollTop() + log.innerHeight()) >= log[0].scrollHeight - 100;
                const category = html.find('.tabs .item.active').attr("data-tab")
                if (pct && source.pages[category].next) {
                    const tab = html.find('.tab.active')
                    source.filterItems.call(source, tab, category, source.pages[category].next)
                }
            },
            100));
    }

    getItemFromHTML(ev) {
        const itemId = $(ev.currentTarget).parents(".browser-item").attr("data-item-id")
        const type = $(ev.currentTarget).closest('.tab').attr("data-tab")
        switch (type) {
            case "zoo":
                return this.zooIndex.find(itemId)
            case "journal":
                return this.journalIndex.find(itemId)
            default:
                return this.equipmentIndex.find(itemId)
        }
    }

    showLoading(html, category) {
        this.setBGImage([1], category)
        const loading = $(`<div class="loader"><i class="fa fa-4x fa-spinner fa-spin"></i>${game.i18n.localize('Library.buildingIndex')}</div>`)
        loading.appendTo(html.find('.searchResult'))
    }

    hideLoading(html, category) {
        this.setBGImage([], category)
        html.find('.loader').remove()
    }
}