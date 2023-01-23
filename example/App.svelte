<script>
    import SimpleList from "./SimpleList.svelte"
    import SimpleListStore from "./SimpleListStore.svelte"
    import InfiniteList from "./InfiniteList.svelte"
    // import PageList from "./PageList.svelte"
    import Table from "./Table.svelte"
    import ChangeableData from "./ChangeableData.svelte"
    let navPushState = true

    let pages = [
        {name: "Simple list", component: SimpleList},
        // {name: "Page mode", component: PageList},
        {name: "Table", component: Table, horizontalModeNotSupported: true},
        {name: "ChangeableData", component: ChangeableData},
        {name: "SimpleListStore", component: SimpleListStore},
        {name: "Infinite list", component: InfiniteList, stickyHeader: true}
    ]

    /** @param {string} name */
    const getParam = name => {
        const url = new URL(window.location.href)
        return decodeURIComponent(url.searchParams.get(name) || "")
    }

    /**
     * @param {string} name
     * @param {string} value
     */
    const setParam = (name, value) => {
        const paramValue = encodeURIComponent(value)
        const url = new URL(window.location.href)
        url.searchParams.set(name, paramValue)
        window.history.pushState({}, "", url)
    }

    /** @param {string} name */
    const getPageByName = name => pages.find(page => page.name === name) || pages[0]

    /** @param {string} name */
    const setActivePage = (name) => {
        currentPage = getPageByName(name)
        setParam("page", name)
    }

    const keepsDefault = 30

    const parseKeepsParam = () => {
        const keeps = parseInt(getParam("keeps"), 10)
        if (keeps && !isNaN(keeps) && isFinite(keeps) && keeps  > 0) {
            return keeps
        }
        return keepsDefault
    }

    const createUrlSearchParams = (pageName = '') => {
        const params = new URLSearchParams()
        if (pageName) params.set("page", pageName)
        if (pageMode) params.set("pageMode", "1")
        if (horizontalMode) params.set("horizontal", "1")
        if (keeps !== keepsDefault) params.set("keeps", keeps.toString())
        return '?' + params.toString()
    }

    let currentPage = getPageByName(getParam("page"))
    let horizontalMode = getParam("horizontal") === "1"
    let pageMode = getParam("pageMode") === "1"
    let keeps =  parseKeepsParam()
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

    $: {
        setParam("horizontal", horizontalMode ? "1" : "0")
        setParam("pageMode", pageMode ? "1" : "0")
        setParam("keeps", keeps + "")
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


</script>

<div class="page">
    <header>
        <h1>@blastart/svelte-virtual-scroll-list example
        </h1>
        <div class="page-selector-container">
            <div class="page-selector-inner">
                {#each pages as page}

                <a
                    class="page-selector"
                    on:click={onNavigate.bind(null, page)}
                    href={createUrlSearchParams(page.name)}
                    class:active={currentPage.name === page.name}
                >{page.name}</a>

                {/each}
                <div class="view-modes">
                    <label>
                        <input type="checkbox" bind:checked={pageMode} /> pageMode
                    </label>
                    {#if pageMode}
                        <label class="wobble" title="for testing page offset changes">
                            <input type="checkbox" bind:checked={testOffsetChange} />
                            {#if testOffsetChange}Stop wobbling{:else}wobble{/if}
                        </label>
                    {/if}
                    <label>
                        <input type="checkbox" bind:checked={horizontalMode} /> horizontal
                    </label>
                    <label>
                        keeps <input style="width: 50px" maxlength="3" min="3" max="200" type="number" bind:value={keeps} />
                    </label>

                    <label style="opacity: 0.75; margin-left: auto;" title="Use history.pushState for navigation">
                        <input type="checkbox" bind:checked={navPushState} /> pushState
                    </label>
                    <a class="source" href="https://github.com/v1ack/svelte-virtual-scroll-list/tree/master/example">Source</a>
                </div>
            </div>
        </div>
        <div class="page-state-container">
            Current page: {currentPage.name} | horizontal mode:
            {#if horizontalMode && currentPage.horizontalModeNotSupported === true}
                <b style="color: red">not supported</b>
            {:else}
            {horizontalMode}
            {/if}
        </div>
    </header>
    <hr class="h-line" />
    <main>
        <svelte:component keeps={keeps} pageMode={pageMode} horizontalMode={horizontalMode} this={currentPage.component}/>
    </main>
</div>

<style>
    h1 {
        font-size: 24px;
    }
    label {
        display: inline-block;
        margin-right: 1em;
    }

    label input {
        margin-bottom: 0;
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
        background-color: rgba(200, 200, 200, 0.85);
        position: sticky;
        top: 0;
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
        background: #eee;
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
        color: blue;
    }

    .page-selector:hover {
        text-decoration: underline;
    }

    .page-selector.active {
        font-weight: bold;
    }


    .page-state-container,
    .page-selector-inner {
        max-width: 860px;
        margin: 0 auto;
    }
    .source {
        float: right;
        color: blue;
    }

    :global(.toasts){
        position: fixed;
        top: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px;
    }
    :global(.toasts > div) {
        background: rgba(0, 0, 0, 0.75);
        padding: 10px;
        border-radius: 5px;
        color: white;
        text-align: center;
    }

    :global(.overflow-buttons) {
        z-index: 2;
        top: 10px;
        position: sticky;
        text-align: right;
        box-sizing: border-box;
    }
    :global(.sticky-header.page-mode .overflow-buttons) {
        top: auto;
        left: 0;
        bottom: 20px;
        padding: 0 1rem;
        position: fixed;
        width: 100%;
        pointer-events: none;
    }
    :global(.sticky-header.page-mode .overflow-buttons button) {
        pointer-events: auto;
    }

    :global(.virtual-scroll--view-list .virtual-scroll__item ) {
        padding: 4px 0;
    }
    :global(.test-offset-change) .wobble {
        position: fixed;
        top: 0;
        left: 0;
        border-radius: 12px;
        transform-origin: top left;
        transform: scale(2);
        background-color: yellow;
        padding: 0.5rem 1rem;
    }

    :global(.test-offset-change) {
        animation: wobblePaddingTop 2000ms infinite linear;
    }
    :global(.test-offset-change.horizontal-mode) {
        animation: wobblePaddingLeft 2000ms infinite linear;
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
