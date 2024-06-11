<script>
    import {tick} from "svelte"
    import VirtualScroll from "../lib/VirtualScroll.svelte"
    import {createSequenceGenerator, randomInteger} from "./mock"
    import TestItem from "./TestItem.svelte"
    export let horizontalMode = false
    export let pageMode = false
    export let fixSize = false

    /** @type {import('../lib/index').TypeDebugVirtualScrollPartial} */
    export let debug
    /** @type {number} */
    export let keeps

    /** @type {import('../lib/virtual').KEEPS_BEHAVIOR} */
    export let behavior

    const getItemId = createSequenceGenerator()

    /** @type {{size: number, uniqueKey: number}[]} */
    let items = []

    /** @type {VirtualScroll} */
    let list

    function addItems(count = 10, top = true) {
        const new_items = []

        for (let i = 0; i < count; i++) {
            new_items.push({
                uniqueKey: getItemId(),
                minHeight: horizontalMode ? '250px' : 'auto',
                size: fixSize ? 100 : randomInteger(40, 160)
            })
        }

        items = top ? [...new_items, ...items] : [...items, ...new_items]

    }

    $: {
        void fixSize
        void horizontalMode
        items = []
        if (list) list.resetSizes()
        addItems(100)
    }
</script>
<div class="vs">
    <VirtualScroll
        bind:this={list}
        debug={debug}
        data={items}
        keeps={keeps}
        keepsBehavior={behavior}
        key="uniqueKey"
        pageMode={pageMode}
        isHorizontal={horizontalMode}
        let:data
    >
        <!-- <his slot is used to render debug info, no need to use it in production -->
        <div slot="beforeList" let:slotData><slot name="appDebugInfo" {slotData} /></div>

        <div slot="empty"><div style="padding: 2em; text-align: center;">No items</div></div>

        <div slot="header">
            This is a header
        </div>
        <TestItem horizontalMode={horizontalMode} {...data}>
            <var>key: {data.uniqueKey}</var>
            <var>set: {data.size}</var>
            <var>calc: {list?.getSize(data.uniqueKey) || 'n/a'}</var>
        </TestItem>
        <div slot="footer">
            This is a footer
        </div>
    </VirtualScroll>
</div>
<div class="overflow-buttons">
    <button on:click={() => addItems(10, true)}>Add 10 to top</button>
    <button on:click={() => addItems(10, false)}>Add 10 to bottom</button>
    <button on:click={list.scrollToBottom}>To bottom</button>
    <button on:click={async() => {
        addItems(1, false)
        await tick()
        list.scrollToBottom()
    }}>Add 1 and scroll to bottom
    </button>
    <button on:click={() => {
        items[98].size = randomInteger(10, 450)
        items = [...items]
    }}>Random size for item 98</button>
</div>

<style>
    .vs{
        height: 400px;
        max-width: 100%;
    }
    :global(.page-mode) .vs{
        height: auto;
        max-width: none;
    }

</style>
