<script>
    import SimpleList from "./SimpleList.svelte"
    import SimpleListStore from "./SimpleListStore.svelte"
    import InfiniteList from "./InfiniteList.svelte"
    import MultiSelect from "./MultiSelectPage.svelte"
    import {KEEPS_BEHAVIOR, MIN_KEEPS, defaults} from "../lib/virtual"
    import {getParam, setParam, isNumInRange, parseJSON, useClickOutside} from "./apps.lib"
    // import PageList from "./PageList.svelte"
    import Table from "./Table.svelte"
    import ChangeableData from "./ChangeableData.svelte"
    let showOtherOptions = false
    let navPushState = true

    let pages = [
        {name: "Simple list", component: SimpleList},
        // {name: "Page mode", component: PageList},
        {
            name: "Multiselect",
            component: MultiSelect,
            stickyHeader: true,
            horizontalModeNotSupported: true,
            fixSizeNotSupported: true,
            pageModeNotSupported: true
        },
        {name: "Table", component: Table, horizontalModeNotSupported: true},
        {name: "ChangeableData", component: ChangeableData},
        {name: "SimpleListStore", component: SimpleListStore},
        {name: "Infinite list", component: InfiniteList, stickyHeader: true}
    ]

    /** @param {string} name */
    const getPageByName = name => pages.find(page => page.name === name) || pages[0]

    /** @param {string} name */
    const setActivePage = (name) => {
        currentPage = getPageByName(name)
        setParam("page", name)
    }


    const parseKeepsParam = () => {
        const keeps = parseInt(getParam("keeps"), 10)
        if (keeps && !isNaN(keeps) && isFinite(keeps) && keeps >= MIN_KEEPS) {
            return keeps
        }
        return defaults.keeps
    }

    const createUrlSearchParams = (pageName = '') => {
        const params = new URLSearchParams()
        if (pageName) params.set("page", pageName)
        if (pageMode) params.set("pageMode", "1")
        if (fixSize) params.set("fixSize", "1")
        if (horizontalMode) params.set("horizontal", "1")
        if (keeps !== defaults.keeps) params.set("keeps", keeps.toString())
        if (behavior !== "auto") params.set("behavior", behavior)
        params.set("debug", JSON.stringify(debug))
        return '?' + params.toString()
    }

    /**
     * @param {import('../lib/index').TypeDebugVirtualScroll} debug
    */
    function validateDebug(debug) {
        const {efficiency = 0, info = 0, others = {showKeeps: true}} = (
            typeof debug === "object" && debug ? debug : {}
        )
        return {
            efficiency: isNumInRange(efficiency, 0, 2) ? efficiency : 0,
            info: isNumInRange(info, 0, 2) ? info : 0,
            others: others && typeof others?.showKeeps === "boolean" ? others : {
                showKeeps: true
            },
            logErrors: true
        }
    }
    const hideOtherOptions = () => showOtherOptions = false


    const behaviors = Object.values(KEEPS_BEHAVIOR)

    let currentPage = getPageByName(getParam("page"))
    let horizontalMode = getParam("horizontal") === "1"
    let fixSize = getParam("fixSize") === "1"
    let pageMode = getParam("pageMode") ? getParam("pageMode") === "1" : true
    let keeps =  parseKeepsParam() || defaults.keeps
    let behavior = behaviors.includes(getParam("behavior")) ? getParam("behavior") : defaults.keepsBehavior
    let debug = validateDebug(parseJSON(getParam("debug")))


    let testOffsetChange = false

    /**
     * @param {{name: string}} page
     * @param {MouseEvent} e
     */
    const onNavigate = (page, e) => {
        if (navPushState) {
            e.preventDefault()
            setActivePage(page.name)
        }
    }

    $: pageMode = currentPage.pageModeNotSupported !== true ? pageMode : false
    $: horizontalMode = currentPage.horizontalModeNotSupported !== true ? horizontalMode : false
    $: fixSize = currentPage.fixSizeNotSupported !== true ? fixSize : false

    $: {
        setParam("fixSize", fixSize ? "1" : "0")
        setParam("horizontal", horizontalMode ? "1" : "0")
        setParam("pageMode", pageMode ? "1" : "0")
        setParam("keeps", keeps + "")
        setParam("behavior", behavior)
        setParam("debug", JSON.stringify(debug))
        debug = validateDebug(debug)
        document.documentElement.classList.toggle(
            "horizontal-mode", horizontalMode && !currentPage.horizontalModeNotSupported
        )
        document.documentElement.classList.toggle("page-mode", pageMode)
        document.documentElement.classList.toggle("sticky-header", !!currentPage.stickyHeader)

        if (!pageMode && testOffsetChange) {
            testOffsetChange = false
        }
        document.documentElement.classList.toggle("test-offset-change", testOffsetChange)
        pages = pages.slice(0)

    }

    $: {
        void behavior
        if (behavior !== KEEPS_BEHAVIOR.AS_IS) {
            keeps = 10
        }
    }

    let lastHorizontalMode = horizontalMode

    $: {
        // TODO: there is a calculation bug when switching between
        // horizontal and vertical mode without page reload.
        if (horizontalMode !== lastHorizontalMode) {
            lastHorizontalMode = horizontalMode
            window.location.reload()
        }
    }



</script>

<div class="page">

    <header>
        <h1>@blastart/svelte-virtual-scroll-list example
        </h1>
        <div class="page-selector-container">
            <div class="page-selector-inner">
                <nav>
                    {#each pages as page}
                    <a
                        class="page-selector"
                        on:click={onNavigate.bind(null, page)}
                        href={createUrlSearchParams(page.name)}
                        class:active={currentPage.name === page.name}
                    >{page.name}</a>
                    {/each}
                </nav>

                <div class="view-modes">
                    <div style:max-width="100px" style="background: #333; margin-right: 5px">
                        <label title={currentPage.pageModeNotSupported ? "Page mode not available for this component" : ""}>
                            <input name="pageMode" type="checkbox" bind:checked={pageMode} disabled={currentPage.pageModeNotSupported} /> pageMode
                        </label>
                        {#if pageMode}
                            <label class="wobble" title="for testing page offset changes">
                                <input name="wobble" type="checkbox" bind:checked={testOffsetChange} disabled={currentPage.pageModeNotSupported} />
                                {#if testOffsetChange}Stop wobbling{:else}wobble{/if}
                            </label>
                        {/if}
                    </div>
                    <label title={currentPage.horizontalModeNotSupported ? "Horizontal mode not available for this component" : ""}>
                        <input name="horizontalMode" type="checkbox" bind:checked={horizontalMode} disabled={currentPage.horizontalModeNotSupported} /> horizontal
                    </label>
                    <label title={currentPage.fixSizeNotSupported ? "fixSize not available for this component" : ""}>
                        <input name="fixSize" type="checkbox" bind:checked={fixSize} disabled={currentPage.fixSizeNotSupported}  /> fixSize
                    </label>
                    <label>
                        keeps <input name="keeps" style="width: 50px" maxlength="3" min="{MIN_KEEPS}" max="200" type="number" bind:value={keeps} />
                    </label>
                    <label>
                        behavior
                        <select  name="behavior" bind:value={behavior} style:width='100px'>
                            {#each behaviors as value}
                                <option value={value}>{value}</option>
                            {/each}
                        </select>
                    </label>
                    <label style="opacity: 0.75; margin-left: auto;" title="Use history.pushState for navigation">
                        <input name="navPushState" type="checkbox" bind:checked={navPushState} /> pushState
                    </label>

                    <a class="source" href="https://github.com/v1ack/svelte-virtual-scroll-list/tree/master/example">Source</a>
                </div>
            </div>
        </div>
        <div class="page-state-container">
            {#if horizontalMode && currentPage.horizontalModeNotSupported === true}
                <b style="color: red">Table: horizontal view not supported</b>
            {/if}
            {#if pageMode && currentPage.pageModeNotSupported === true}
                <b style="color: red">Table: page node not supported</b>
            {/if}
            <div class="other-ops" use:useClickOutside on:click_outside={hideOtherOptions}>
                <button on:click={() => { showOtherOptions = !showOtherOptions }} class="other-ops__show-others">
                    {#if showOtherOptions}Hide{:else}Show{/if} debug options
                </button>
                {#if showOtherOptions}
                <div class="other-ops__content">
                    <label>
                        debug.logErrors <input  type="checkbox" name="debug.logErrors" bind:checked={debug.logErrors} />
                    </label>
                    <label title="0 - no log | 1 - log major info | 2 - log major & minor info">
                        debug.info <input name="debug.info" style:width="45px" bind:value={debug.info} type="number" min="0" max="2" maxlength="1">
                    </label>
                    <label title="0 - no log | 1 - log major efficient improvements | 2 - log major & minor improvements">
                        debug.efficiency <input name="debug.efficiency" style:width="45px" bind:value={debug.efficiency} type="number" min="0" max="2" maxlength="1">
                    </label>
                    <label>
                        showKeeps <input name="showKeeps" type="checkbox" bind:checked={debug.others.showKeeps} />
                    </label>
                </div>
                {/if}
            </div>
        </div>
    </header>
    <hr class="h-line" />
    <main>
        <svelte:component
            debug={debug}
            behavior={behavior}
            keeps={keeps}
            fixSize={fixSize}
            pageMode={pageMode}
            horizontalMode={horizontalMode}
            this={currentPage.component}
        >
            <div slot="appDebugInfo" let:slotData>
                {#if (debug?.others?.showKeeps)}
                <div class="app__debug" style="z-index: 20; position: fixed; bottom: 1rem; left: 1rem; padding: 0.5rem; background: #222; color: #ccc; font-size: 18px;">
                    <b title="Calculated value of keeps">keeps:</b> {slotData?.keepsCalculated}
                    <br>
                    <small><b title="Fixed type as long as the list contains elements of the same size.">fixed:</b> {slotData?.isFixedType ? 'yes' : 'no'}</small>
                </div>
                {/if}
            </div>
        </svelte:component>
    </main>
</div>

<style>
    h1 {
        font-size: 24px;
        color: #888;
        margin-bottom: 1.25em;
    }

    label {
        display: inline-block;
        margin-right: 1em;
        font-size: 14px;
        color: var(--primary-color);
        white-space: nowrap;
    }
    label:has(input:disabled) {
        opacity: 0.5;
    }

    label:hover {
        color: var(--hihglight-color);
    }

    label input {
        margin-bottom: 0;
    }


    .other-ops {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-left: auto;
        overflow: visible;
    }
    .other-ops .other-ops__content {
        position: absolute;
        top: 30px;
        right: 0;
        font-size: 14px;
        padding: 1rem;
        box-sizing: border-box;
        color: var(--primary-color);
        background: #444;
        z-index: 3;
        border: none;
        cursor: pointer;
        margin: 0;
        margin-left: 1em;
    }
    .other-ops .other-ops__content label {
        margin: 0.5rem 0;
    }
    .other-ops .other-ops__content label input {
        margin-left: 0.5rem;
    }

    .other-ops > button {
        background: none;
        color: #fff;
        border: 0 none;
        text-decoration: underline;
    }

    .page {
        padding: 1em;
        margin: 0 auto;
        max-width: 900px;
        box-sizing: border-box;
    }
    .view-modes {
        padding-top: 1rem;
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    :global(.horizontal-mode.page-mode body) {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
    }

    :global(.sticky-header.page-mode ) header {
        margin-bottom: 2rem;
        background-color: rgba(64, 64, 64, 0.9);
        position: sticky;
        top: 0;
        color: #fff;
        box-sizing: border-box;
        z-index: 100;
        width: 100%;
        padding: 1rem 2rem;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        border-radius: 12px;
    }
    :global(.horizontal-mode.page-mode div.overflow-buttons) {
        position: fixed;
        top: 0;
        right: 0;
        z-index: 100;
    }


    :global(.horizontal-mode.page-mode) header {
        left: 0;
        top: 0;
        position: fixed;
        width: 100%;
        box-sizing: border-box;
        padding: 1em;
    }
    :global(.horizontal-mode.page-mode div.overflow-buttons) {
        bottom: 0;
        top: auto;
    }
    :global(.horizontal-mode.page-mode) .page {
        margin: 0;
        max-width: none;
        padding: 240px 0 0 0;
    }

    .page-selector-container {
        margin-bottom: 20px;
    }

    .page-selector {
        margin-right: 1rem;
        cursor: pointer;
    }

    .page-selector:hover {
        text-decoration: underline;
    }

    .page-selector.active {
        font-weight: bold;
    }

    h1,
    .page-state-container,
    .page-selector-inner {
        max-width: 860px;
        margin-left: auto;
        margin-right: auto;
    }
    .page-state-container {
        display: flex;
    }


    .page-selector-inner {
        overflow-x: auto;
        flex-direction: column;
        display: flex;
    }
    .page-selector-inner nav {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .page-selector-inner nav a {
        white-space: nowrap;
    }

    .source {
        float: right;
    }


    :global(.overflow-buttons) {
        z-index: 2;
        top: 5px;
        position: sticky;
        text-align: right;
        padding: 0 10px;
        box-sizing: border-box;
        pointer-events: none;
    }
    :global(.overflow-buttons button) {
        margin-top: 0.25rem;
        margin-bottom: 0.25rem;
    }

    :global(.sticky-header.page-mode .overflow-buttons) {
        top: auto;
        left: 0;
        bottom: 20px;
        padding: 0 1rem;
        position: fixed;
        width: 100%;
    }
    :global(.overflow-buttons button) {
        pointer-events: auto;
    }
    :global(.virtual-scroll--view-list .virtual-scroll__item ) {
        padding: 4px;
        box-sizing: border-box;
    }
    :global(.virtual-scroll__item var) {
        margin: 0 5px;
    }

    :global(.horizontal-mode .virtual-scroll__item var) {
        margin: 0 5px;
        display: block;
    }


    :global(.test-offset-change) .wobble {
        position: fixed;
        top: 0;
        left: 0;
        border-radius: 12px;
        transform-origin: top left;
        transform: scale(2);
        background-color: var(--hihglight-color);
        padding: 0.5rem 1rem;
        color: black;
        z-index: 100;
    }

    :global(.test-offset-change) {
        animation: wobblePaddingTop 2000ms infinite linear;
    }
    :global(.test-offset-change.horizontal-mode) {
        animation: wobblePaddingLeft 2000ms infinite linear;
    }

    :global(.virtual-scroll__spacer) {
        padding: 0;
        border: 0 none;
        will-change: height;
    }
    :global(.virtual-scroll--dir-horizontal .virtual-scroll__spacer) {
        will-change: width;
    }

    @media (max-width: 900px) {
        h1 {
            font-size: 3vw;
        }
    }

    :root {
        --wobble-amp: 150px;
    }
    @keyframes wobblePaddingTop {
        0% { padding-top: 0; }
        50% { padding-top: var(--wobble-amp); }
        100% { padding-top: 0; }
    }
    @keyframes wobblePaddingLeft {
        0% { padding-left: 0; }
        50% { padding-left: var(--wobble-amp); }
        100% { padding-left: 0; }
    }
</style>
