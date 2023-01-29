<script>
    import Virtual, {joinClassNames, defaultNameSpace, rifFn, browser} from "./virtual"
    import Item from "./Item.svelte"
    import {createEventDispatcher, onDestroy, onMount, tick} from "svelte"

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

    export let keepsBehaviour = Virtual.KEEPS_BEHAVIOUR.AS_IS

    /** @return {('scrollLeft'|'scrollTop')} */
    const getScrolltDirectionKey = () => isHorizontal ? "scrollLeft" : "scrollTop"


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

    /** @type {import('./virtual').TypeRange | null} */
    let range = null


    // TODO: reveal new properties from Virtual.param
    const virtual = new Virtual({
        keeps: keeps,
        keepsBehaviour: keepsBehaviour,
        estimateSize: estimateSize,
        buffer: Math.round(keeps / 3) || 5, // recommend for a third of keeps
        uniqueIds: getUniqueIdFromDataSources(),
        scrollTo: (pos) => {
            scrollTo(pos)
        }
    }, function(rng, afterRender) {
        // callUpdate
        range = rng

        displayItems = data.slice(rng.start, rng.end + 1)
        // console.log("displayItems", displayItems)
        tick().then(() => afterRender(getClientSize()))
    })

    /** @type {HTMLElement} for scrollable tables **/
    let wrapper

    /** @type {HTMLElement} */
    let root

    const refFooterSlot = { current: null }

    const dispatch = createEventDispatcher()

    export function triggerScroll() {
        dispatch("scroll", {
            event: new CustomEvent(defaultNameSpace + '-scroll-tirgger'),
            range: virtual.getRange()
        })
    }

    /**
     * @param {import('./index').TypeUniqueKey} id of item
     */
    export function getSize(id) {
        return virtual.sizes.get(id)
    }

    export function getSizes() {
        return virtual.sizes.size
    }

    export function clearSizes() {
        return virtual.clearSizes()
    }

    /**
     * @type {() => number}
     */
    export function getScrollPos() {
        if (!browser) return 0
        const scrolltDirectionKey = getScrolltDirectionKey()
        if (pageMode) {
            return document.documentElement[scrolltDirectionKey] || document.body[scrolltDirectionKey]
        } else if (tableView) {
            return wrapper ? Math.ceil(wrapper[scrolltDirectionKey]) : 0
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
        } else if (tableView) {
            return wrapper ? Math.ceil(wrapper[key]) : 0
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
        } else if (tableView) {
            return wrapper ? Math.ceil(wrapper[key]) : 0
        } else {
            return root ? Math.ceil(root[key]) : 0
        }
    }


    export const updatePageModeFront = (function() {
        let lastOffset = 0

        return function() {
            if (!root || !browser) return

            let offset = 0
            let offsetRaw = 0

            if (pageMode) {
                const rect = root.getBoundingClientRect()
                const {defaultView = window} = root.ownerDocument
                if (!defaultView) return

                offsetRaw = isHorizontal
                    ? (rect.left + defaultView.pageXOffset)
                    : (rect.top + defaultView.pageYOffset)

                offset = Math.round(offsetRaw * 1000) / 1000
            }

            if (offset === lastOffset) return
            console.warn("updatePageModeFront", offset, offsetRaw, pageMode)
            virtual.updateParam("pageModeOffset", offset)
            lastOffset = offset
        }
    })()

    // window.updatePageModeFront = updatePageModeFront
    // window.triggerScroll = triggerScroll
    window.virtual = virtual

    /**
     * @type {(position: number) => void} - scroll to position by px
     */
    export function scrollTo(position) {
        if (!browser) return
        const scrolltDirectionKey = getScrolltDirectionKey()

        if (pageMode) {
            document.body[scrolltDirectionKey] = position
            document.documentElement[scrolltDirectionKey] = position
        } else if (tableView && wrapper) {
            wrapper[scrolltDirectionKey] = position
        } else if (!tableView && root) {
            root[scrolltDirectionKey] = position
        }
        triggerScroll()
    }

    /**
     * @type {(index: number) => void}
     */
    export function scrollToIndex(index) {
        if (index >= data.length - 1) {
            scrollToBottom()
        } else {
            const offset = virtual.getScrollPosByIndex(index)
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


    export const tableStyle = [
        'display: table',
        // 'table-layout:fixed',
        'padding: 0',
        'border-collapse: collapse',
        'width: 100%',
        'border-spacing: 0'
    ].join(';')

    /**
     * @typedef {{tableView: boolean, isHorizontal: boolean, pageMode: boolean}} TypeViewModes
     */
    /**
     * @typedef {(viewModes: TypeViewModes, range: import('./virtual').TypeRange | null) => string} TypeStyleCallback
     */


    /**
     * @type {TypeStyleCallback} returns the style of header slot
     */
    export function wrapperStyle({tableView, pageMode}) {
        const cssProps = [
            'height: inherit'
        ]
        if (tableView && !pageMode) {
            cssProps.push(
                'position: relative',
                'overflow-y: auto'
            )
        }
        return cssProps.join(";")
    }

    /**
     * @type {TypeStyleCallback} returns the style of root elem.
     */
    export function rootStyle({tableView, isHorizontal, pageMode}) {
        const cssProps = [
            `height: ${pageMode || tableView ? "auto" : "inherit"}`,
            'max-width: 100%'
        ]
        if (!tableView) {
            cssProps.push(
                isHorizontal ? 'overflow-x: auto' : 'overflow-y: auto',
                isHorizontal ? 'width: auto' : 'width: 100%'
            )
        }

        if (tableView) {
            cssProps.push(
                tableStyle
                // `margin: ${range?.padFront ?? 0}px 0px ${range?.padBehind ?? 0}px`
            )
        }

        if (isHorizontal && !tableView) {
            cssProps.push('display: flex', 'flex-direction: row', 'flex-wrap: nowrap')
        }

        return cssProps.join(";")
    }


    /**
     * @type {TypeStyleCallback} returns the style of list elem.
     */
    export function listStyle({tableView, isHorizontal}, range) {
        const cssProps = []
        if (!tableView) {
            const pStyle = isHorizontal
                ? `0px ${range?.padBehind ?? 0}px 0px ${range?.padFront ?? 0}px`
                : `${range?.padFront ?? 0}px 0px ${range?.padBehind ?? 0}px`
            cssProps.push(`padding: ${pStyle}`)
        }

        if (isHorizontal && !tableView) {
            cssProps.push('display: flex', 'flex-direction: row', 'flex-wrap: nowrap')
        }
        return cssProps.join(";")
    }

    /**
     * @type {TypeStyleCallback} returns the style of header slot
     */
    export function itemStyle() {
        return ''
    }

    /**
     * @type {TypeStyleCallback} returns the style of header slot
     */
    export function headerSlotStyle() {
        return ''
    }

    /**
     * @type {TypeStyleCallback} returns the style of footer slot
     */
    export function footerSlotStyle() {
        return ''
    }


    const rifDocumentScroll = rifFn(() => {
        updatePageModeFront()
        // update again after keepBehavior finished
        tick().then(() => updatePageModeFront())
    })

    /** @param {Event} e */
    function onDocumentScroll(e) {
        if (!pageMode) return
        onScroll(e)
        rifDocumentScroll()
    }

    /** for tables
     * @param {Event} e
     */
    function onWrapperScroll(e) {
        if (!pageMode && tableView) {
            onScroll(e)
        }
    }

    /** @param {Event} e */
    function onRootScroll(e) {
        if (pageMode || tableView) {
            return
        }
        onScroll(e)
    }


    /** @param {UIEvent} e */
    function onWindowResize(e) {
        onScroll(e) // keep it on top
        if (pageMode) rifDocumentScroll()
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
            // wrapper.addEventListener("scroll", onWrapperScroll, {
            //     passive: false
            // })

            window.addEventListener("resize", onWindowResize)
        }
    })

    onDestroy(() => {
        virtual.destroy()
        if (browser) {
            document.removeEventListener("scroll", onDocumentScroll)
            // wrapper.removeEventListener("scroll", onWrapperScroll)
            window.removeEventListener("resize", onWindowResize)
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
        }
    }


    /**
     * @param {Event | UIEvent} event
     */
    function onScroll(event) {
        const scrollPos = getScrollPos()
        const clientSize = getClientSize()
        const scrollSize = getScrollSize()

        // iOS scroll-spring-back behavior will make direction mistake
        if (scrollPos < 0 || (scrollPos + clientSize > scrollSize + 1) || !scrollSize) {
            // console.warn('IOS GESTURE')
            return
        }

        virtual.handleScroll(scrollPos, clientSize, scrollSize)

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
        virtual.handleDataSourcesChange('handleKeepsChange')
    }

    async function handleDataSourcesChange(reset = false, log = '') {
        if (reset) {
            virtual.reset()
            return
        }

        virtual.updateParam("uniqueIds", getUniqueIdFromDataSources())
        virtual.handleDataSourcesChange(log + ' reset: ' + reset)

        await tick()

        triggerScroll()

    }



    const getChangedProps = (() => {
        /** @return {Object<string, any>} */
        const getCurrent = () => ({
            isHorizontal, tableView, pageMode, keepsBehaviour, data
        })
        let state = getCurrent()

        return () => {
            const prev = state
            state = getCurrent()
            return Object.keys(prev).filter((key) => prev[key] !== state[key])
        }
    })()


    $: scrollTo(offset)
    $: scrollToIndex(start)
    $: handleKeepsChange(keeps)
    $: propsRootDstructed = destructElementProps(propsRoot)
    $: propsListDstructed = destructElementProps(propsList)
    $: propsItemDstructed = destructElementProps(propsItem)

    const initial = { value: true }

    $: {
        void data
        void pageMode
        void keepsBehaviour
        void isHorizontal
        void tableView

        const changed = getChangedProps()

        if (isHorizontal && tableView) {
            virtual.logError("Horizontal mode doesn't support table view")
            isHorizontal = false
        }

        updatePageModeFront()

        if (changed.includes('isHorizontal')) {
            handleDataSourcesChange(true, 'isHorizontal')
        } else if (changed.includes('keepsBehaviour')) { // TODO: not updating
            handleDataSourcesChange(true, 'keepsBehaviour')
        } else  if (changed.includes('data')) {
            handleDataSourcesChange(false, 'dataSoftChange')
        }

        console.error(changed)

        if (!initial.value) {
            tick().then(() => {
                virtual.refreshScrollPos()
                console.error(changed)
            })
            initial.value = false
        }
    }




</script>

<div class="{nameSpace}__wrapper"
    bind:this={wrapper}
    on:scroll={onWrapperScroll}
    style={wrapperStyle({tableView, isHorizontal, pageMode}, range)}
>


    <svelte:element
        {...propsRootDstructed.restProps}
        style={rootStyle({tableView, isHorizontal, pageMode}, range)}
        this={tableView ? 'table' : propsRootDstructed.tagName || 'div'}
        class={joinClassNames(
            nameSpace,
            `${nameSpace}--dir-${isHorizontal ? "horizontal" : "vertical"}`,
            `${nameSpace}--view-${tableView ? "table" : "list"}`,
            `${nameSpace}--${pageMode ? "page-mode" : "overflow-mode"}`,
            propsRootDstructed.className
        )}
        bind:this={root}
        on:scroll={onRootScroll}
    >

        {#if $$slots.header}
            <Item
                tagName={tableView ? "thead" : "div"}
                style={footerSlotStyle({tableView, isHorizontal, pageMode}, range)}
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
            style={listStyle({tableView, isHorizontal, pageMode}, range)}
            this={tableView ? 'tbody' : propsListDstructed.tagName || 'div'}
            class={joinClassNames(`${nameSpace}__list`, propsListDstructed.className)}
        >
            {#if tableView && range}
                <tr
                    class="{nameSpace}__table-spacer"
                    style="border: 0 none; height: {range.padFront}px"
                />
            {/if}

            {#each displayItems as dataItem (dataItem[key])}
                {@const index = data.indexOf(dataItem)}
                <Item
                    aria-setsize={data.length}
                    aria-posinset={index + 1}
                    role={tableView ? null : "listitem"}
                    style={itemStyle({tableView, isHorizontal, pageMode}, range)}
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
                    <slot {index} data={dataItem} />
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
            style={footerSlotStyle({tableView, isHorizontal, pageMode}, range)}
            {...propsFooterSlot}
            on:resize={onItemResized}
            type="slot"
            ref={refFooterSlot}
            uniqueKey="footer"
        >
            <slot name="footer"/>
        </Item>
    </svelte:element>
</div>
