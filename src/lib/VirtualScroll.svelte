<script>
    import Virtual, { defaultNameSpace, browser, setDebug, getDebug, defaults} from "./virtual"
    import { joinClassNames, rifFn } from './lib'

    import Item from "./Item.svelte"
    import {createEventDispatcher, onDestroy, onMount, tick} from "svelte"


    /** @type {import('../lib/index').TypeDebugVirtualScroll} */
    export let debug = false

    /** @type {import('../lib/index').TypeUniqueKey} Unique key for getting data from `data` */
    export let key = "id"

    /** @type {string | null | undefined} Unique key for getting data from `data` */
    export let id = null

    /** @type {string | null | undefined} Unique key for getting data from `data` */
    export let wrapperId = null

    /** @type {string | null | undefined} Unique key for getting data from `data` */
    export let rootId = null

    /** @type {string} css BEM / event namespacing */
    export let nameSpace = defaultNameSpace

    /** @type {import('../lib/index').TypeDataItem[]} Source for list */
    export let data

    /** @type {import('../lib/virtual').TypeKeeps | undefined}  */
    export let keeps = undefined

    /** @type {import('../lib/virtual').TypeBuffer | undefined}  */
    export let buffer = undefined

    /** @type {import('../lib/virtual').TypeSlotHeaderSize | undefined}  */
    export let slotHeaderSize = undefined

    /** @type {import('../lib/virtual').TypeSlotFooterSize | undefined}  */
    export let slotFooterSize = undefined

    /** @type {import('../lib/virtual').TypeFillMaxSize | undefined}  */
    export let fillMaxSize = undefined

    /** @type {import('../lib/virtual').TypeFillSizeMultiplier | undefined}  */
    export let fillSizeMultiplier = undefined

    /** @type {import('../lib/virtual').TypeAutoUpdateAverageSize | undefined}  */
    export let autoAutoUpdateAverageSize = true


    /** @type {import('../lib/virtual').TypeEstimateSize | undefined } Estimate size of each item, needs for smooth scrollbar */
    export let estimateSize = undefined

    /** @type {boolean}  Scroll direction */
    export let isHorizontal = false

    /** @type {number} scroll position start index */
    export let start = 0

    /** @type {number} scroll position offset */
    export let scrollPos = 0

    /** @type {boolean} Let virtual list using table instead of div */
    export let tableView = false

    /** @type {boolean} Let virtual list using global document to scroll through the list */
    export let pageMode = false

    /** @type {number} The threshold to emit `top` event, attention to multiple calls. */
    export let topThreshold = 0

    /** @type {number} The threshold to emit `bottom` event, attention to multiple calls. */
    export let bottomThreshold = 0


    /** @type {import('../lib/index').TypeElementProps} Props of root element */
    export let propsRoot = {}

    /** @type {import('../lib/index').TypeElementProps} Props of list element */
    export let propsList = {}

    /** @type {import('../lib/index').TypeElementProps} Props of item element */
    export let propsItem = {}

    /** @type {import('../lib/index').TypeElementProps} Pros for the Item in the header slot */
    export let propsHeaderSlot = {}

    /** @type {import('../lib/index').TypeElementProps} Pros for the Item in the footer slot */
    export let propsFooterSlot = {}

    export let keepsBehavior = defaults.keepsBehavior

    /** @type {string | null | undefined} aria-role for item */
    export let ariaControls = null

    /** @type {string | null | undefined} aria-describedby */
    export let ariaDescribedby = null

    /** @type {string | null | undefined} aria-role */
    export let ariaRole = "listbox"
    /** @type {string | null | undefined} aria-role for item */
    export let ariaRoleForItem = "listitem"

    /** @type {string | null | undefined}  aria-label */
    export let ariaLabel = null

    /** @type {string | null}  aria-label for item */
    export let ariaLabelForItem = null


    /** Dispatching custom resize events from the item's resize observer
     * (This may have a slight negative impact on performance.)
    */
    export let dispatchResizeEvents = false


    /** @return {('scrollLeft'|'scrollTop')} */
    const getScrollDirectionKey = () => isHorizontal ? "scrollLeft" : "scrollTop"


    /**
     * @param {import('../lib/index').TypeElementProps} elementProps
     * @returns {{tagName?: string, className?: string, restProps: Object<string, any>}}
     */
    const destructElementProps = (elementProps) => {
        const {tagName, className, ...restProps} = elementProps
        return {tagName, className, restProps}
    }

    /** @type  {import('../lib/index').TypeDataItem[]} */
    let displayItems = []

    /** @type {import('../lib/virtual').TypeRange} */
    let range

    /** create data to pass to each slot <slot let:slotData /> */
    const getSlotData = () => ({
        isFixedType: virtual.isFixedType(),
        keepsCalculated: virtual.getKeepsCalculated(),
        key,
        nameSpace,
        range,
        debug,
        data,
        displayItems,
        pageMode,
        isHorizontal,
        tableView
    })

    // TODO: reveal new properties from Virtual.param
    const virtual = new Virtual({
        keeps: keeps || undefined,
        keepsBehavior,
        estimateSize,
        fillMaxSize,
        fillSizeMultiplier,
        autoAutoUpdateAverageSize,
        slotHeaderSize,
        slotFooterSize,
        buffer, // recommend for a third of keeps
        uniqueIds: getUniqueIdFromDataSources(),

        scrollTo: (pos) => scrollTo(pos)
    }, function(rng, afterRender) {
        // callUpdate
        range = rng

        displayItems = data.slice(rng.start, rng.end + 1)


        if (displayItems.length === 0) {
            getDebug().any && console.log(
                "callUpdate: no item to display", displayItems, {
                    start: rng.start,
                    end: rng.end,
                    irlEnd: rng.end + 1,
                    dataLength: data.length,
                    slotData
                })
        }
        tick().then(() => afterRender(getClientSize()))
    })


    /** @type {HTMLElement} for scrollable tables **/
    let wrapperRef

    /** @type {HTMLElement} */
    let rootRef


    const dispatch = createEventDispatcher()

    /** Trigger a scroll event */
    export function triggerScroll() {
        dispatch("scroll", {
            event: new CustomEvent(defaultNameSpace + '-scroll-trigger'),
            range: virtual.getRange()
        })
    }

    /**  @param {import('../lib/index').TypeUniqueKey} id of item */
    export function getSize(id) {
        return virtual.sizes.get(id)
    }

    export function getSizes() {
        return virtual.sizes.size
    }

    /** reset calculated size values  */
    export function resetSizes() {
        return virtual.resetSizes()
    }

    /** @param {keyof HTMLElement} key - key of HTMLElement */
    function getScrollableKeyValue(key) {
        if (!browser || !key) return undefined

        /** @type {unknown} */
        let value

        if (pageMode) {
            value = document.documentElement[key] || document.body[key]
        } else if (tableView) {
            value =  wrapperRef ? wrapperRef[key] : 0
        } else {
            value = rootRef ? rootRef[key] : 0
        }

        return value
    }


    /** @type {() => number} scrollLeft or scrollTop depending on isHorizontal */
    export function getScrollPos() {
        if (!browser) return 0
        const pos = getScrollableKeyValue(getScrollDirectionKey())
        return typeof pos === "number" ? pos : 0
    }

    /** @type {() => number} scrollLeft or scrollTop depending on isHorizontal, relative */
    export function getScrollPosRelative() {
        if (!browser) return 0
        const pos = getScrollPos()
        return typeof pos === "number" ? virtual.getScrollPosByPx(pos) : 0
    }



    /** @type {() => number} clientWidth or clientHeight depending on isHorizontal */
    export function getClientSize() {
        if (!browser) return 0
        const key = isHorizontal ? "clientWidth" : "clientHeight"
        const size = getScrollableKeyValue(key)

        return typeof size === "number" ? size : 0
    }

    /** @type {() => number} scrollWidth or scrollHeight depending on isHorizontal */
    export function getScrollSize() {
        if (!browser) return 0

        const key = isHorizontal ? "scrollWidth" : "scrollHeight"
        const size = getScrollableKeyValue(key)

        return typeof size === "number" ? size : 0
    }

    /** @type {() => void} update pageModeOffset */
    export const updatePageModeFront = (function() {
        let lastOffset = 0

        return function() {
            if (!rootRef || !browser) return

            let offset = 0
            let offsetRaw = 0

            if (pageMode) {
                const rect = rootRef.getBoundingClientRect()
                const {defaultView = window} = rootRef.ownerDocument
                if (!defaultView) return

                offsetRaw = isHorizontal
                    ? (rect.left + defaultView.pageXOffset)
                    : (rect.top + defaultView.pageYOffset)

                // offset = Math.round(offsetRaw * 10) / 10
                offset = offsetRaw
            }

            if (offset === lastOffset) return
            virtual.updateParam("pageModeOffset", offset)
            lastOffset = offset
        }
    })()

    /** @type {() => number} offset */
    export function getPageModeFront() {
        return virtual.getFrontSize()
    }

    /** @type {(position: number) => void} - scroll to position by px */
    export function scrollTo(position) {
        if (!browser) return
        const scrollDirectionKey = getScrollDirectionKey()

        if (pageMode) {
            document.body[scrollDirectionKey] = position
            document.documentElement[scrollDirectionKey] = position
        } else if (tableView && wrapperRef) {
            wrapperRef[scrollDirectionKey] = position
        } else if (!tableView && rootRef) {
            rootRef[scrollDirectionKey] = position
        }
        triggerScroll()
    }

    /** @param {number} pos */
    export function scrollToRelative(pos) {
        virtual.scrollToPx(pos)
    }

    /** @type {(index: number) => void} */
    export function scrollToIndex(index) {
        if (typeof index !== "number") return

        if (index >= data.length - 1) {
            scrollToBottom()
        } else {
            // const offset = virtual.getScrollPosByIndex(index)
            // scrollTo(offset)
            virtual.scrollToIndex(index)
        }
    }


    /**
     * @param {Event | null} [_e] - event if called by event handler
     * @param {number} [_retries] - retry count to avoid possible infinite loop
     */
    export function scrollToBottom(_e, _retries = data.length) {
        const scrollEnd = getScrollSize()
        scrollTo(scrollEnd)
        // getDebug().any && console.log("scrollToBottom", footerOffset, scrollEnd, getScrollPos() + getClientSize())

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


    /**
     * param index available only for items
     * @typedef {(
     *  viewModes: {tableView: boolean, isHorizontal: boolean, pageMode: boolean, index?: number },
     *  range: import('../lib/virtual').TypeRange | null) => string
     * } TypeStyleCallback
     */


    /** @type {TypeStyleCallback} returns the style of wrapper element */
    export let wrapperStyle = ({tableView, pageMode}) => {
        const cssProps = [
            'position: relative',
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

    /** @type {TypeStyleCallback} returns the style of root elem. */
    export let rootStyle = ({tableView, isHorizontal, pageMode}) => {
        const cssProps = [
            'max-width: 100%'
        ]
        if (!pageMode && !tableView) {
            cssProps.push('height: inherit')
        }
        if (!tableView) {
            cssProps.push(
                isHorizontal ? 'overflow-x: auto' : 'overflow-y: auto',
                isHorizontal ? 'width: auto' : 'width: 100%'
            )
        }

        if (tableView) {
            cssProps.push(
                'display: table',
                // 'table-layout:fixed',
                'padding: 0',
                'border-collapse: collapse',
                'width: 100%',
                'border-spacing: 0'
                // `margin: ${range?.padFront ?? 0}px 0px ${range?.padBehind ?? 0}px`
            )
        }

        if (isHorizontal && !tableView) {
            cssProps.push('display: flex', 'flex-direction: row', 'flex-wrap: nowrap')
        }

        return cssProps.join(";")
    }

    /** @type {TypeStyleCallback} returns the style of list elem. */
    export let listStyle = ({tableView, isHorizontal}) => {
        const cssProps = []
        if (isHorizontal && !tableView) {
            cssProps.push('display: flex', 'flex-direction: row', 'flex-wrap: nowrap')
        }
        return cssProps.join(";")
    }

    /** @type {TypeStyleCallback} returns the style of header slot */
    export let itemStyle = () => {


        return ''
    }

    /** @type {TypeStyleCallback} returns the style of header slot */
    export let headerSlotStyle = () => {
        return ''
    }

    /** @type {TypeStyleCallback} returns the style of footer slot */
    export let footerSlotStyle = () => {
        return ''
    }

    const rifDocumentScroll = rifFn(() => {
        updatePageModeFront()
        // update again after keepBehavior finished
        tick().then(() => updatePageModeFront())
    })


    /** @param {Event} e scroll event for window */
    function onDocumentScroll(e) {
        if (!pageMode) return
        onScroll(e)
        rifDocumentScroll()
    }

    /** @param {Event} e scroll event for wrapper in table view */
    function onWrapperScroll(e) {
        if (!pageMode && tableView) {
            onScroll(e)
        }
    }

    /** @param {Event} e scroll event for root */
    function onRootScroll(e) {
        if (pageMode || tableView) {
            return
        }
        onScroll(e)
    }

    // const onWindowResizeDebounced = debounceFn((e) => {
    //     // @ts-ignore
    //     onScroll(e)
    // }, 250)

    /** @param {UIEvent} e resize event for window */
    function onWindowResize(e) {
        onScroll(e) // keep it on top
        // onWindowResizeDebounced(e)
        if (pageMode) rifDocumentScroll()
    }


    onMount(() => {
        if (start) {
            scrollToIndex(start)
        } else if (scrollPos) {
            scrollTo(scrollPos)
        }

        if (browser) {
            updatePageModeFront()
            // document.addEventListener("scroll", onDocumentScroll, { passive: false })
            // window.addEventListener("resize", onWindowResize)
        }
    })

    onDestroy(() => {
        virtual.destroy()
        if (browser) {
            // document.removeEventListener("scroll", onDocumentScroll)
            // window.removeEventListener("resize", onWindowResize)
        }
    })


    function getUniqueIdFromDataSources() {
        return data.map((dataSource) => dataSource[key])
    }


    /** @type {import('../lib/index').TypeResizeFnPassive} */
    function onItemResizedPassive(detail, _native = false) {
        const {id, size, type} = detail
        // !_native && console.timeEnd("onItemResizedPassive_" + id)

        if (type === "item") {
            virtual.saveSize(id, size)
        } else if (type === "slot") {
            if (id === "header") {
                virtual.updateParam("slotHeaderSize", size)
            } else if (id === "footer") {
                virtual.updateParam("slotFooterSize", size)
            } else if (id === "empty") {
                // do nothing
            }
        }
    }


    /**
     * @param {import('../lib/index').TypeResizeEvent | CustomEvent<any>} e
    */
    function onItemResized(e) {
        // console.timeEnd("dispatchSizeChange_" + e.detail.id)
        onItemResizedPassive(e.detail, true)
    }


    /** @param {Event | UIEvent} event */
    function onScroll(event) {
        const scrollPos = getScrollPos()
        const clientSize =  getClientSize()
        const scrollSize = getScrollSize()

        // iOS scroll-spring-back behavior will make direction mistake
        if (scrollPos < 0 || (scrollPos + clientSize > scrollSize + 1) || !scrollSize) {
            // getDebug().any && console.warn('IOS GESTURE')
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
        if (virtual.isFront() && data.length > 0 && Math.ceil(offset - topThreshold) <= 0) {
            dispatch("top")
        } else if (virtual.isBehind() && Math.ceil(offset + clientSize + bottomThreshold) >= scrollSize) {
            dispatch("bottom")
        }
    }


    /**
     * @param {boolean} reset reset calculated sizes and positions
     * @param {string} [log] log message for debugging
     */
    async function handleDataSourcesChange(reset = false, log = '') {
        if (reset) {
            virtual.reset()
            return
        }
        virtual.updateParam("uniqueIds", getUniqueIdFromDataSources())
        virtual.handleDataSourcesChange(log + ' | reset: ' + reset)
    }


    /** helper fn to determine what props have changed */
    const getChangedProps = (() => {
        /** @return {Object<string, unknown>} */
        const getCurrent = () => ({
            isHorizontal, tableView, pageMode, keepsBehavior, data, keeps, buffer,
            estimateSize, fillMaxSize, fillSizeMultiplier, autoAutoUpdateAverageSize,
            slotHeaderSize, slotFooterSize
        })
        let state = getCurrent()
        return () => {
            const prev = state
            state = getCurrent()
            const keys = Object.keys(prev).filter((key) => prev[key] !== state[key])

            /** @type {Object.<string, {key: string, from: any, to: any}>} */
            const values = {}

            return {
                keys,
                values: keys.reduce((acc, key) => {
                    acc[key] = { key, to: state[key], from: prev[key] }
                    return acc
                }, values)
            }
        }
    })()

    /** called for any changes that may affect the virtual list  */
    const handlePropsChange = (function() {
        const propsTriggersReset = ['isHorizontal']
        const paramsToUpdate = Object.keys(defaults)

        return () => {
            const changed = getChangedProps()
            // no changes
            if (changed.keys.length === 0) return

            // update page offset
            updatePageModeFront()

            // update virtual list params
            changed.keys.forEach(param => {
                if (paramsToUpdate.includes(param)) {
                    // TODO: fix type
                    // @ts-ignore
                    virtual.updateParam(param, changed.values[param].to)
                }
            })
            // some props change require a hard reset because they affect calculations
            const hardReset = changed.keys.some((prop) => propsTriggersReset.includes(prop))

            // update data sources
            handleDataSourcesChange(hardReset, changed.keys.join(', '))

            getDebug().logInfo > 0 && console.info('info: params changed', changed, data.length)

            // refresh scroll position if pageMode or isHorizontal changed
            if (changed.keys.includes('pageMode') || changed.keys.includes('isHorizontal')) {
                tick().then(() => {
                    getDebug().any && console.info('refreshScrollPos')
                    virtual.refreshScrollPos()
                })
            }
        }
    })()


    let slotData = getSlotData()

    $: scrollTo(scrollPos)
    $: scrollToIndex(start)
    $: setDebug(debug)
    $: {
        void displayItems
        // data passed to all slots: <slot let:slotData />
        slotData = getSlotData()
    }
    $: propsRootDestructed = destructElementProps(propsRoot)
    $: propsListDestructed = destructElementProps(propsList)
    $: propsItemDestructed = destructElementProps(propsItem)
    $: {
        void data
        void isHorizontal
        void pageMode
        // params
        void tableView
        void buffer
        void keeps
        void keepsBehavior
        void estimateSize
        void fillMaxSize
        void fillSizeMultiplier
        void autoAutoUpdateAverageSize
        void slotHeaderSize
        void slotFooterSize

        if (isHorizontal && tableView) {
            virtual.logError("Horizontal mode doesn't support table view")
            isHorizontal = false
        } else if (isHorizontal && autoAutoUpdateAverageSize) {
            virtual.logError("autoAutoUpdateAverageSize not supported in horizontal mode")
            autoAutoUpdateAverageSize = false
            handlePropsChange()
        } else {
            handlePropsChange()
        }
    }

    // create a global variable named window._virtual_scroll with the virtual list instance and getSlotData fn
    const windowNs =  '_' + defaultNameSpace.replace(/[-\s]/g, '_')
    // @ts-ignore
    if (browser && debug && window[windowNs] && debug?.others?.storeAsGlobal) {
        // @ts-ignore
        window[windowNs] = { virtual, getSlotData }
    }

    // Sveltekit hoisting bug: when rendering via ssr, variables defined in each block are initially undefined
    // eslint-disable-next-line
    const index = 0
    // eslint-disable-next-line
    const dataItem = null
</script>

<svelte:window on:scroll={onDocumentScroll} on:resize={onWindowResize} />

<!-- Wrapper element -->
<div class="{nameSpace}__wrapper"
    id={wrapperId}
    bind:this={wrapperRef}
    on:scroll={onWrapperScroll}
    style={wrapperStyle({tableView, isHorizontal, pageMode}, range)}
>

    {#if $$slots.beforeList}
        <slot name="beforeList" slotData={slotData} />
    {/if}

    <!-- Root element -->
    <svelte:element
        {...propsRootDestructed.restProps}
        id={rootId}
        style={rootStyle({tableView, isHorizontal, pageMode}, range)}
        this={tableView ? 'table' : propsRootDestructed.tagName || 'div'}
        class={joinClassNames(
            nameSpace,
            `${nameSpace}--${isHorizontal ? "horizontal" : "vertical"}`,
            `${nameSpace}--view-${tableView ? "table" : "list"}`,
            `${nameSpace}--${pageMode ? "page-mode" : "overflow-mode"}`,
            propsRootDestructed.className
        )}
        bind:this={rootRef}
        on:scroll={onRootScroll}
    >

        {#if $$slots.header}
            <!-- Header -->
            <Item
                tagName={tableView ? "thead" : "div"}
                style={headerSlotStyle({tableView, isHorizontal, pageMode}, range)}
                {...propsHeaderSlot}
                on:resize={dispatchResizeEvents ? onItemResized : null}
                onItemResizedPassive={dispatchResizeEvents ? null : onItemResizedPassive}
                nameSpace="{nameSpace}"
                type="slot"
                uniqueKey="header"
            >
                <slot name="header" slotData={slotData} />
            </Item>
        {/if}

        <!-- list -->
        <svelte:element
            role={tableView ? null : ariaRole}
            id={id}
            aria-controls={ariaControls}
            aria-describedby={ariaDescribedby}
            aria-label={ariaLabel}
            {...propsListDestructed.restProps}
            style={listStyle({tableView, isHorizontal, pageMode}, range)}
            this={tableView ? 'tbody' : propsListDestructed.tagName || 'div'}
            class={joinClassNames(`${nameSpace}__list`, propsListDestructed.className)}
        >
            {#if range}
                <!-- top spacer -->
                <svelte:element
                    aria-hidden="true"
                    class="{nameSpace}__spacer {nameSpace}__spacer-top"
                    this={tableView ? 'tr' : 'div'}
                    style={`${isHorizontal ? 'width' : 'height'}: ${range.padFront}px`}
                />
            {/if}

            <!-- list items -->
            {#each displayItems as dataItem (dataItem[key])}
                {@const index = data.indexOf(dataItem)}
                <Item
                    aria-setsize={data.length}
                    aria-posinset={index + 1}
                    aria-label={ariaLabelForItem}
                    role={tableView ? null : ariaRoleForItem}
                    style={itemStyle({tableView, isHorizontal, pageMode, index}, range)}
                    {...propsItemDestructed.restProps}
                    tagName={tableView ? "tr" : propsItemDestructed.tagName || "div"}
                    index={index}
                    className={propsItemDestructed.className}
                    nameSpace="{nameSpace}"
                    on:resize={dispatchResizeEvents ? onItemResized : null}
                    onItemResizedPassive={dispatchResizeEvents ? null : onItemResizedPassive}
                    uniqueKey={dataItem[key]}
                    horizontal={isHorizontal}
                    type="item"
                >
                    <slot index={index} data={dataItem} range={range} slotData={slotData} />
                </Item>
            {/each}

            {#if displayItems.length === 0}
                <!--Empty item -->
                <Item
                    tagName={tableView ? "tr" : "div"}
                    style={itemStyle({tableView, isHorizontal, pageMode}, range)}
                    {...propsItemDestructed.restProps}
                    className={propsItemDestructed.className}
                    nameSpace="{nameSpace}"
                    on:resize={dispatchResizeEvents ? onItemResized : null}
                    onItemResizedPassive={dispatchResizeEvents ? null : onItemResizedPassive}
                    uniqueKey="empty"
                    horizontal={isHorizontal}
                    type="slot"
                >
                    <slot name="empty" slotData={slotData} />
                </Item>
            {/if}

            {#if range}
                <!-- bottom spacer -->
                <svelte:element
                    aria-hidden="true"
                    class="{nameSpace}__spacer {nameSpace}__spacer-bottom"
                    this={tableView ? 'tr' : 'div'}
                    style={`${isHorizontal ? 'width' : 'height'}: ${range.padBehind}px`}
                />
            {/if}
        </svelte:element>

        {#if $$slots.footer}
            <!-- Footer -->
            <Item
                tagName={tableView ? "tfoot" : "div"}
                style={footerSlotStyle({tableView, isHorizontal, pageMode}, range)}
                {...propsFooterSlot}
                on:resize={dispatchResizeEvents ? onItemResized : null}
                onItemResizedPassive={dispatchResizeEvents ? null : onItemResizedPassive}
                type="slot"
                uniqueKey="footer"
            >
                <slot name="footer" slotData={slotData} />
            </Item>
        {/if}

    </svelte:element>

    {#if $$slots.afterList}
        <slot name="afterList" slotData={slotData} />
    {/if}

</div>
