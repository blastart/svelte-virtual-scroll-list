<script>
    import {tick} from "svelte"
    import VirtualScroll from "../src/VirtualScroll.svelte"
    import {asyncTimeout, createSequenceGenerator, randomInteger} from "./mock"
    import TestItem from "./TestItem.svelte"
    export let horizontalMode = false
    export let pageMode = false
    export let fixSize = false
    /** @type {import('../src/index').TypeDebugVirtualScroll} */
    export let debug

    /** @type {number} */
    export let keeps

    /** @type {import('../src/virtual.js').KEEPS_BEHAVIOR} */
    export let behavior

    const getItemId = createSequenceGenerator()

    let loading = false
    let loadingDirection = 'bottom'

    /** @type {{size: number, uniqueKey: number}[]} */
    let items = itemsFactory(70)

    /** @type {VirtualScroll} */
    let list

    function itemsFactory(count = 10) {
        const new_items = []
        for (let i = 0; i < count; i++)
            new_items.push({
                uniqueKey: getItemId(),
                minHeight: horizontalMode ? '250px' : 'auto',
                size: fixSize ? 100 : randomInteger(40, 260)
            })
        return new_items
    }

    async function asyncAddItems(top = true, count = 10) {
        if (loading) return
        loading = true
        loadingDirection = top ? 'top' : 'bottom'
        await asyncTimeout(1000)

        const new_items = itemsFactory(count)

        if (top) {
            items = [...new_items, ...items]
            // to save position on adding items to top we need to calculate
            // new top offset based on added items
            //
            // it works ONLY if newly added items was rendered
            tick().then(() => {
                const sids = new_items.map(i => i.uniqueKey)
                const offset = sids.reduce(
                    (previousValue, currentSid) => previousValue + (list.getSize(currentSid) ?? 0), 0
                )
                list.scrollTo(offset)
            })
        } else {
            items = [...items, ...new_items]
            // TODO: fix this hack
            // timeout needs because sometimes when you scroll down `scroll` event fires twice
            // and changes list.virtual.direction from BEHIND to FRONT
            // maybe there is a better solution
            setTimeout(() => list.scrollTo(list.getScrollPos() + 1), 3)
        }
        loading = false
    }

    $: {
        void fixSize
        void horizontalMode
        if (list) list.resetSizes()
        items = itemsFactory(70)
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
        on:top={() => asyncAddItems(true)}
        on:bottom={() => asyncAddItems(false)}
        start={30}
    >

        <!-- <his slot is used to render debug info, no need to use it in production -->
        <div slot="beforeList" let:slotData><slot name="appDebugInfo" {slotData} /></div>

        <div slot="empty"><div style="padding: 2em; text-align: center;">No items</div></div>

        <div slot="header">
            {#if loading && loadingDirection === "top"}
                loading...
            {/if}
        </div>

        <TestItem horizontalMode={horizontalMode} {...data}>
            <var>key: {data.uniqueKey}</var>
            <var>set: {data.size}</var>
            <var>calc: {list?.getSize(data.uniqueKey) || 'n/a'}</var>
        </TestItem>

        <div slot="footer">
            {#if loading && loadingDirection === "bottom"}
                loading...
            {:else}

                scroll {horizontalMode ? 'right' : 'down'} to load more items
            {/if}
        </div>
    </VirtualScroll>
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
