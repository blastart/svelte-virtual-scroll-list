<script>
    import Virtual, {joinClassNames, defaultNameSpace, rifFn} from "./virtual"
    import Item from "./Item.svelte"
    import {createEventDispatcher, onDestroy, onMount, tick} from "svelte"

    const browser = typeof window !== "undefined"

    /** @type {import('./index').TypeUniqueKey} Unique key for getting data from `data` */
    export let key = "id"

    /** @type {string} css BEM / event namespacing */
    export let nameSpace = defaultNameSpace

    /** @type {import('./index').TypeDataItem[]} Source for list */
    export let data

    /** @type {number} Count of rendered items */
    export let keeps = 30

    /** @type {number} Estimate size of each item, needs for smooth scrollbar */
    export let estimateSize = 50

    /** @type {boolean}  Scroll direction */
    export let isHorizontal = false

    /** @type {number} scroll position start index */
    export let start = 0

    /** @type {number} scroll position offset */
    export let offset = 0

    /** @type {boolean} Let virtual list using table instead of div */
    export let tableView = false

    /** @type {boolean} Let virtual list using global document to scroll through the list */
    export let pageMode = false

    /** @type {number} The threshold to emit `top` event, attention to multiple calls. */
    export let topThreshold = 0

    /** @type {number} The threshold to emit `bottom` event, attention to multiple calls. */
    export let bottomThreshold = 0



    /** @type {import('./index').TypeElementProps} Props of root element */
    export let propsRoot = {}

    /** @type {import('./index').TypeElementProps} Props of list element */
    export let propsList = {}

    /** @type {import('./index').TypeElementProps} Props of item element */
    export let propsItem = {}

    /** @type {import('./index').TypeElementProps} Pros for the Item in the header slot */
    export let propsHeaderSlot = {}

    /** @type {import('./index').TypeElementProps} Pros for the Item in the footer slot */
    export let propsFooterSlot = {}

    /**
     * @param {import('./index').TypeElementProps} elementProps
     * @returns {{tagName?: string, className?: string, restProps: Object<string, any>}}
     */
    const destructElementProps = (elementProps) => {
        const {tagName, className, ...restProps} = elementProps
        return {tagName, className, restProps}
    }

    /** @type  {import('./index').TypeDataItem[]} */
    let displayItems = []

    /** @type {string | null} */
    let paddingStyle = null

    /** @type {"scrollLeft" | "scrollTop"} */
    let scrolltDirectionKey

    /** @type {import('./virtual').TypeRange | null} */
    let range = null

    const virtual = new Virtual({
        keeps: keeps,
        estimateSize: estimateSize,
        buffer: Math.round(keeps / 3) || 5, // recommend for a third of keeps
        uniqueIds: getUniqueIdFromDataSources()
    }, onRangeChanged)

    /** @type {HTMLElement} */
    let root

    const refFooterSlot = { current: null }

    const dispatch = createEventDispatcher()

    /**
     * @param {import('./index').TypeUniqueKey} id of item
     */
    export function getSize(id) {
        return virtual.sizes.get(id)
    }

    export function getSizes() {
        return virtual.sizes.size
    }

    /**
     * @type {() => number}
     */
    export function getScrollPos() {
        if (!browser) return 0

        if (pageMode) {
            return document.documentElement[scrolltDirectionKey] || document.body[scrolltDirectionKey]

        } else {
            return root ? Math.ceil(root[scrolltDirectionKey]) : 0
        }
    }

    /**
     * @type {() => number}
     */
    export function getClientSize() {
        if (!browser) return 0

        const key = isHorizontal ? "clientWidth" : "clientHeight"
        if (pageMode) {
            return document.documentElement[key] || document.body[key]
        } else {
            return root ? Math.ceil(root[key]) : 0
        }
    }

    /**
     * @type {() => number}
     */
    export function getScrollSize() {
        if (!browser) return 0

        const key = isHorizontal ? "scrollWidth" : "scrollHeight"
        if (pageMode) {
            return document.documentElement[key] || document.body[key]
        } else {
            return root ? Math.ceil(root[key]) : 0
        }
    }


    export const updatePageModeFront = (function() {
        let lastOffset = 0

        return function() {
            if (!root || !browser) return

            let offset = 0

            if (pageMode) {
                const rect = root.getBoundingClientRect()
                const {defaultView} = root.ownerDocument
                if (!defaultView) return

                offset = isHorizontal
                    ? (rect.left + window.pageXOffset)
                    : (rect.top + window.pageYOffset)
            }
            if (offset === lastOffset) return
            // console.log("updatePageModeFront", offset)
            virtual.updateParam("pageModeOffset", offset)
            lastOffset = offset
        }
    })()


    /**
     * @type {(position: number) => void} - scroll to position by px
     */
    export function scrollTo(position) {
        if (!browser) return

        if (pageMode) {
            document.body[scrolltDirectionKey] = position
            document.documentElement[scrolltDirectionKey] = position
        } else if (root) {
            root[scrolltDirectionKey] = position
        }
    }

    /**
     * @type {(index: number) => void}
     */
    export function scrollToIndex(index) {
        if (index >= data.length - 1) {
            scrollToBottom()
        } else {
            const offset = virtual.getOffset(index)
            scrollTo(offset)
        }
    }

    /**
     * @param {Event | null} [_e] - event if called by event handler
     * @param {number} [_retries] - retry count to avoid possible infinite loop
     * @retrun {() => void}
     */
    export function scrollToBottom(_e, _retries = data.length) {
        if (refFooterSlot.current) {
            const offsetHelperOffset = refFooterSlot.current[isHorizontal ? "offsetLeft" : "offsetTop"]
            scrollTo(offsetHelperOffset)

            // TODO: fix this hack
            // check if it's really scrolled to the bottom
            // maybe list doesn't render and calculate to last range,
            // so we need retry in next event loop until it really at bottom
            if (_retries > 0) {
                requestAnimationFrame(() => {
                    if (getScrollPos() + getClientSize() + 1 < getScrollSize()) {
                        scrollToBottom(null, _retries - 1)
                    }
                })
            }
        }
    }


    /**
     * @param {{tableView: boolean, isHorizontal: boolean, pageMode: boolean}} modes
     * @return {string} css string
     */
    export function rootStyle({tableView, isHorizontal, pageMode}) {
        const cssProps = [
            `height: ${pageMode ? "auto" : "inherit"}`,
            'max-width: 100%',
            isHorizontal ? 'overflow-y: auto' : 'overflow-y: auto'
        ]
        if (tableView) {
            cssProps.push(
                'border-collapse: collapse',
                `display: ${pageMode ? "table" : "block"}`
            )
        }

        if (isHorizontal && !tableView) {
            cssProps.push('display: flex', 'flex-direction: row', 'flex-wrap: nowrap')
        }

        return cssProps.join(";")
    }


    /**
     * @param {{tableView: boolean, isHorizontal: boolean, pageMode: boolean}} modes
     * @param {string | null} paddingStyle - css padding value
     * @return {string} css string
     */
    export function listStyle({tableView, isHorizontal}, paddingStyle) {
        const cssProps = []
        if (!tableView && paddingStyle) {
            cssProps.push(`padding: ${paddingStyle}`)
        }
        if (isHorizontal && !tableView) {
            cssProps.push('display: flex', 'flex-direction: row', 'flex-wrap: nowrap')
        }
        return cssProps.join(";")
    }

    // let lastCall = 0
    const rifDocumentScroll = rifFn(() => {
        // const now = Date.now()
        // console.log('rifFnd', now - lastCall)
        // lastCall = now
        updatePageModeFront()
    })

    /** @param {Event} e */
    function onDocumentScroll(e) {
        if (!pageMode) return
        onScroll(e)
        rifDocumentScroll()
    }

    onMount(() => {
        if (start) {
            scrollToIndex(start)
        } else if (offset) {
            scrollTo(offset)
        }

        if (browser) {
            updatePageModeFront()

            document.addEventListener("scroll", onDocumentScroll, {
                passive: false
            })
        }
    })

    onDestroy(() => {
        virtual.destroy()
        if (browser) {
            document.removeEventListener("scroll", onDocumentScroll)
        }
    })

    function getUniqueIdFromDataSources() {
        return data.map((dataSource) => dataSource[key])
    }

    /**
     * @param {import('./index').TypeResizeEvent | CustomEvent<any>} e
    */
    function onItemResized(e) {
        const {id, size, type} = e.detail

        if (type === "item") {
            virtual.saveSize(id, size)
        } else if (type === "slot") {
            if (id === "header") {
                virtual.updateParam("slotHeaderSize", size)
            } else if (id === "footer") {
                virtual.updateParam("slotFooterSize", size)
            }
            // virtual.handleSlotSizeChange()
        }
    }

    /**
     * @param {import('./virtual').TypeRange} rng
     */
    function onRangeChanged(rng) {
        range = rng
        // console.log("onRangeChanged", range)
        paddingStyle = isHorizontal
            ? `0px ${range.padBehind}px 0px ${range.padFront}px`
            : `${range.padFront}px 0px ${range.padBehind}px`

        displayItems = data.slice(range.start, range.end + 1)
    }

    /**
     * @param {Event} event
     */
    function onScroll(event) {
        const scrollPos = getScrollPos()
        const clientSize = getClientSize()
        const scrollSize = getScrollSize()

        // iOS scroll-spring-back behavior will make direction mistake
        if (scrollPos < 0 || (scrollPos + clientSize > scrollSize) || !scrollSize) {
            return
        }

        virtual.handleScroll(scrollPos)
        emitEvent(scrollPos, clientSize, scrollSize, event)
    }

    /**
     * @param {number} offset
     * @param {number} clientSize
     * @param {number} scrollSize
     * @param {Event} event
     */
    function emitEvent(offset, clientSize, scrollSize, event) {
        dispatch("scroll", {event, range: virtual.getRange()})

        if (virtual.isFront() && !!data.length && (offset - topThreshold <= 0)) {
            dispatch("top")
        } else if (virtual.isBehind() && (offset + clientSize + bottomThreshold >= scrollSize)) {
            dispatch("bottom")
        }
    }

    /**
     * @param {number} keeps
     */
    function handleKeepsChange(keeps) {
        virtual.updateParam("keeps", keeps)
        virtual.handleDataSourcesChange()
    }

    async function handleDataSourcesChange(reset = false) {
        if (reset) {
            virtual.reset()
            return
        }

        virtual.updateParam("uniqueIds", getUniqueIdFromDataSources())
        virtual.handleDataSourcesChange()

        await tick()

        dispatch("scroll", {
            event: new CustomEvent(defaultNameSpace + '-scroll-tirgger'),
            range: virtual.getRange()
        })
    }

    $: scrollTo(offset)
    $: scrollToIndex(start)
    $: handleKeepsChange(keeps)
    $: propsRootDstructed = destructElementProps(propsRoot)
    $: propsListDstructed = destructElementProps(propsList)
    $: propsItemDstructed = destructElementProps(propsItem)
    $: {
        void pageMode
        updatePageModeFront()

        if (isHorizontal && tableView) {
            console.warn("Horizontal mode doesn't support table view")
            isHorizontal = false
        }

        scrolltDirectionKey = isHorizontal ? "scrollLeft" : "scrollTop"
        tick().then(() => {
            handleDataSourcesChange()
            if (start) scrollToIndex(start)
        })
    }

    $: {
        void data
        handleDataSourcesChange()
    }


</script>
<svelte:element
    {...propsRootDstructed.restProps}
    style={rootStyle({tableView, isHorizontal, pageMode})}
    this={tableView ? 'table' : propsRootDstructed.tagName || 'div'}
    class={joinClassNames(
        nameSpace,
        `${nameSpace}--dir-${isHorizontal ? "horizontal" : "vertical"}`,
        `${nameSpace}--view-${tableView ? "table" : "list"}`,
        `${nameSpace}--${pageMode ? "page-mode" : "overflow-mode"}`,
        propsRootDstructed.className
    )}
    bind:this={root}
    on:scroll={onScroll}
>

    {#if $$slots.header}
        <Item
            tagName={tableView ? "thead" : "div"}
            {...propsHeaderSlot}
            on:resize={onItemResized}
            nameSpace="{nameSpace}"
            type="slot"
            uniqueKey="header"
        >
            <slot name="header"/>
        </Item>
    {/if}

    <svelte:element
        role={tableView ? null : "listbox"}
        {...propsListDstructed.restProps}
        style={listStyle({tableView, isHorizontal, pageMode}, paddingStyle)}
        this={tableView ? 'tbody' : propsListDstructed.tagName || 'div'}
        class={joinClassNames(`${nameSpace}__list`, propsListDstructed.className)}
    >
        {#if tableView && range}
            <tr
                class="{nameSpace}__table-spacer"
                style="border: 0 none; padding: 0; height: {range.padFront}px"
            />
        {/if}

        {#each displayItems as dataItem (dataItem[key])}
            {@const index = data.indexOf(dataItem)}
            <Item
                aria-setsize={data.length}
                aria-posinset={index + 1}
                role={tableView ? null : "listitem"}
                {...propsItemDstructed.restProps}
                tagName={tableView ? "tr" : propsItemDstructed.tagName || "div"}
                index={index}
                className={propsItemDstructed.className}
                nameSpace="{nameSpace}"
                on:resize={onItemResized}
                uniqueKey={dataItem[key]}
                horizontal={isHorizontal}
                type="item"
            >
                <slot {index} data={dataItem}/>
            </Item>
        {/each}

        {#if tableView && range}
            <tr
                class="{nameSpace}__table-spacer"
                style="border: 0 none; padding: 0; height: {range.padBehind}px"
            />
        {/if}
    </svelte:element>


    <Item
        tagName={tableView ? "tfoot" : "div"}
        {...propsFooterSlot}
        on:resize={onItemResized}
        type="slot"
        ref={refFooterSlot}
        uniqueKey="footer"
    >
        <slot name="footer"/>
    </Item>
</svelte:element>
