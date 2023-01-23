<script>
    import VirtualScroll from "../src/VirtualScroll.svelte"
    import {createSequenceGenerator, randomInteger, randomWord, randomString} from "./mock"
    import TestTableCell from "./TestTableCell.svelte"
    export let horizontalMode = false
    export let pageMode = false

    const getItemId = createSequenceGenerator()

    /** @type {{height: number, uniqueKey: number, word: string }[]} */
    let items = []
    addItems(true, 1000)
    /** @type {number} */
    export let keeps

    /** @type {VirtualScroll} */
    let list

    function addItems(top = true, count = 10) {
        const new_items = []
        for (let i = 0; i < count; i++) {
            new_items.push({
                uniqueKey: getItemId(),
                height: randomInteger(40, 100),
                word: randomWord(),
                string: randomString(0, 30)
            })
        }
        if (top) items = [...new_items, ...items]
        else items = [...items, ...new_items]
    }

    const cells = [
        { prop: 'uniqueKey', label: 'id', width: '32px'},
        {prop: 'height', label: 'Height', width: '70px'},
        {prop: 'word', label: 'Word', width: '140px'},
        {prop: 'string', label: 'Long text', width: 'auto'}
    ]
</script>

<div class="overflow-buttons">
    <button on:click={() => list.scrollTo(0)}>To top</button>
    <button on:click={() => list.scrollToBottom()}>To bottom</button>
</div>

<div class="vs">
    <VirtualScroll
        bind:this={list}
        data={items}
        key="uniqueKey"
        keeps={keeps}
        let:data
        pageMode={pageMode}
        tableView={true}
        isHorizontal={horizontalMode}
    >
        <tr slot="header">
            {#each cells as cell}
                <th style:width={cell.width}>{cell.label}</th>
            {/each}
        </tr>

        {#each cells as cell}
            <TestTableCell height="{data.height}px" width={cell.width}>{data[cell.prop]}</TestTableCell>
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




    .vs :global(td), .vs :global(th) {
        border: 1px solid #f6f6f6;
        color: black;
        padding: 5px;
        text-align: left;
    }
    .vs :global(thead tr:first-of-type) {
        position: sticky;
        top: 0;
        background-color: #fff;
    }

</style>
