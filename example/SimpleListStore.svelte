<script>
    import {tick} from "svelte"
    import {flip} from "svelte/animate"
    import {writable} from "svelte/store"
    import VirtualScroll from "../src/VirtualScroll.svelte"
    import {createSequenceGenerator, randomInteger} from "./mock"
    import TestItem from "./TestItem.svelte"
    export let horizontalMode = false
    export let pageMode = false
    export let fixSize = false

    const getItemId = createSequenceGenerator()
    const getNotificationId = createSequenceGenerator()
    /** @type {number} */
    export let keeps

    /** @type {import('../src/virtual.js').KEEPS_BEHAVIOUR} */
    export let behavior

    const items = writable([])

    /** @type {VirtualScroll} */
    let list

    /** @type {Record<string, string>} */
    let notifications = {}

    function addItems(top = true, count = 10) {
        const new_items = []
        for (let i = 0; i < count; i++)
            new_items.push({
                uniqueKey: getItemId(),
                minHeight: horizontalMode ? '200px' : 'auto',
                size: fixSize ? 100 : randomInteger(30, 180)
            })
        if (top)
            $items = [...new_items, ...$items]
        else
            $items = [...$items, ...new_items]
    }

    /**
     * @param {'top' | 'bottom'} action
     */
    function addNotification(action) {
        const id = getNotificationId()
        notifications[id] = action
        setTimeout(() => {
            delete notifications[id]
            // eslint-disable-next-line no-self-assign
            notifications = notifications
        }, 5000)
    }

    function addItemsToTop() {
        addItems(true)
    }

    function addItemsToBottom() {
        addItems(false)
    }

    $: {
        void fixSize
        void horizontalMode
        items.set([])

        if (list) list.resetSizes()

        addItems(false, 5)

    }
</script>

<div class="vs">
    <VirtualScroll
        bind:this={list}
        debug={true}
        data={$items}
        key="uniqueKey"
        keeps={keeps}
        keepsBehaviour={behavior}
        pageMode={pageMode}
        isHorizontal={horizontalMode}
        let:data
        on:bottom={() => addNotification("bottom")}
        on:top={() => addNotification("top")}
    >
        <div slot="header">
            This is a header
        </div>
        <TestItem horizontalMode={horizontalMode} {...data}/>
        <div slot="footer">
            This is a footer
        </div>
    </VirtualScroll>
</div>
<div class="overflow-buttons">
    <button on:click={addItemsToTop}>Add 10 to top</button>
    <button on:click={addItemsToBottom}>Add 10 to bottom</button>
    <button on:click={list.scrollToBottom}>To bottom</button>
    <button on:click={async() => {
        addItems(false, 1)
        await tick()
        list.scrollToBottom()
    }}>Add 1 and scroll to bottom
    </button>
</div>
<div class="toasts">
    {#each Object.entries(notifications) as [id, action] (id)}
        <div animate:flip>{action} </div>
    {/each}
</div>


<style>
    .vs{
        height: 300px;
        max-width: 100%;
    }
    :global(.page-mode) .vs{
        height: auto;
        max-width: none;
    }


</style>
