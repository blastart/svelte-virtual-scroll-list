<script>
    import VirtualScroll from "../src/VirtualScroll.svelte"
    import {createSequenceGenerator, randomInteger, randomWord, randomString} from "./mock"
    import TestTableCell from "./TestTableCell.svelte"
    export let horizontalMode = false
    export let pageMode = false
    export let fixSize = false
    /** @type {import('../src/index').TypeDebugVirtualScroll} */
    export let debug

    const getItemId = createSequenceGenerator()

    /** @type {{height: number, uniqueKey: number, word: string }[]} */
    let items = []
    /** @type {number} */
    export let keeps

    /** @type {import('../src/virtual.js').KEEPS_BEHAVIOUR} */
    export let behavior

    /** @type {VirtualScroll} */
    let list

    function addItems(top = true, count = 10) {
        const new_items = []
        for (let i = 0; i < count; i++) {
            new_items.push({
                uniqueKey: getItemId(),
                height: fixSize ? 50 : randomInteger(40, 300),
                word: randomWord(),
                string: randomString(0, 30)
            })
        }
        if (top) items = [...new_items, ...items]
        else items = [...items, ...new_items]
    }

    const cells = [
        {
            prop: 'uniqueKey',
            label: 'id',
            width: '60px'
        },
        {
            prop: 'height',
            label: 'Height',
            width: '100px'
        },
        {
            prop: 'word',
            label: 'Word',
            width: '140px'
        },
        {
            prop: 'string',
            label: 'Long text',
            width: 'auto'
        }
    ]


    $: {
        void fixSize
        items = []

        if (list) list.resetSizes()
        addItems(true, 1000)
    }

</script>

<div class="overflow-buttons">
    <button on:click={() => list.scrollTo(0)}>To top</button>
    <button on:click={() => list.scrollToBottom()}>To bottom</button>
    <button on:click={() => addItems(true, 10)}>Prepend 10</button>
    <button on:click={() => addItems(false, 10)}>Append 10 </button>
</div>

<div class="vs">
    <VirtualScroll
        bind:this={list}
        debug={debug}
        data={items}
        key="uniqueKey"
        keeps={keeps}
        keepsBehaviour={behavior}
        let:data
        pageMode={pageMode}
        tableView={true}
        isHorizontal={horizontalMode}
    >
        <tr slot="header">
            {#each cells as cell}
                <th style:width={cell.width}><div class="inner">{cell.label}</div></th>
            {/each}
        </tr>

        {#each cells as cell (cell.prop)}
            <TestTableCell height="{data.height}px" width={cell.width}>
                {#if cell.prop === "height"}
                    set: {data[cell.prop]} <br />
                    calc: {list?.getSize(data.uniqueKey) || 'n/a'}
                {:else}
                    {data[cell.prop]}
                {/if}
            </TestTableCell>
        {/each}

        <tr slot="footer">
            <th colspan={cells.length}>This is a footer set via slot</th>
        </tr>
    </VirtualScroll>
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


    .vs :global(th .inner) {
        padding: 10px 5px;
    }
    .vs :global(td), .vs :global(th) {
        border: 1px solid #888;
        border-top: 0 none;
        color: black;
        text-align: left;
        background-color: #eee;
        padding: 0;
        margin: 0;
    }
    .vs :global(thead) {
        /* It's a bit tricky,
            unfortunately Firefox doesn't draw borders
            for sticky thead if the table is border-collapsed. (bugzilla: 1727594, 1531781)
        */
        box-shadow: 0px -1px 0 #888 inset, 0px 1px 0 #888 inset, -1px 0px 0 #888 inset, 0px 0px 0 #888 inset;
        border: 0;
        position: sticky;
        top: 0;
        display: table-header-group;
        background-color: #fff;
    }
    .vs :global(thead th) {
        background-color: transparent;
        /* for firefox */
        box-shadow: -1px 0px 0 #888;
    }


</style>
