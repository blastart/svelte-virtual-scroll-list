<script>
    import {flip} from "svelte/animate"
    import VirtualScroll from "../src/VirtualScroll.svelte"
    import {createSequenceGenerator, randomInteger} from "./mock"
    import TestItem from "./TestItem.svelte"
    export let horizontalMode = false
    export let pageMode = false
    export let fixSize = false
    /** @type {import('../src/index').TypeDebugVirtualScroll} */
    export let debug

    const getItemId = createSequenceGenerator()
    const getNotificationId = createSequenceGenerator()
    /** @type {number} */
    export let keeps

    /** @type {import('../src/virtual').KEEPS_BEHAVIOR} */
    export let behavior

    /** @type {{size: number, uniqueKey: number, minHeight: string }[]} */
    let items = []


    /** @type {VirtualScroll} */
    let list

    /** @type {Record<string, string>} */
    let notifications = {}

    function addItems(count = 10) {
        const new_items = []
        for (let i = 0; i < count; i++) {
            new_items.push({
                uniqueKey: getItemId(),
                minHeight: horizontalMode ? '250px' : 'auto',
                size: fixSize ? 100 : randomInteger(40, 260)
            })
        }
        items = [...items, ...new_items]
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


    $: {
        void fixSize
        void horizontalMode
        items = []
        if (list) list.resetSizes()
        addItems(1000)
    }
</script>

<div class="overflow-buttons">
    <button on:click={() => list.scrollTo(0)}>To top</button>
    <button on:click={list.scrollToBottom}>To bottom</button>
</div>

<div class="vs">
    <VirtualScroll
        bind:this={list}
        debug={debug}
        data={items}
        key="uniqueKey"
        keeps={keeps}
        keepsBehavior={behavior}
        pageMode={pageMode}
        isHorizontal={horizontalMode}
        let:data
        on:bottom={() => addNotification("bottom")}
        on:top={() => addNotification("top")}
    >
        <!-- <his slot is used to render debug info, no need to use it in production -->
        <div slot="beforeList" let:slotData><slot name="appDebugInfo" {slotData} /></div>

        <div slot="empty"><div style="padding: 2em; text-align: center;">No items</div></div>

        <div slot="header">
            This is a header set via slot
        </div>

        <TestItem horizontalMode={horizontalMode} {...data}>
            <var>key: {data.uniqueKey}</var>
            <var>set: {data.size}</var>
            <var>calc: {list?.getSize(data.uniqueKey) || 'n/a'}</var>
        </TestItem>

        <div slot="footer">
            This is a footer set via slot
        </div>
    </VirtualScroll>
</div>

<div class="toasts">
    {#each Object.entries(notifications) as [id, action] (id)}
        <div animate:flip>{action} </div>
    {/each}
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
