<script>
	import MultiSelect from '../lib/components/MultiSelect.svelte'

    import {createSequenceGenerator, randomString} from "./mock"
    /** @type {import('../lib/index').TypeDebugVirtualScrollPartial} */
    export let debug = true

    const getItemId = createSequenceGenerator()
    /** @type {number} */
    export let keeps

    /** @type {import('../lib/virtual').KEEPS_BEHAVIOR} */
    export let behavior

    const valueSeparator = ','

    function getItems(count = 10) {
        const new_items = []
        for (let i = 0; i < count; i++) {
            new_items.push({
                value: getItemId() + '',
                selected: false,
                text: randomString(2, 3)
            })
        }
        return new_items
    }

    /** @type {import('../lib/components/MultiSelect.svelte').TypeItem[]} */
    const items = getItems(50000)

    /** @type {import('../lib/index').TypeRangesArray} */
    let valueArray = [
        0, 2, 3, [14, 30], [100, 200], [300, 400], [500, 600], [700, 800], [900, 4000], [4005, 5020], [40000, 50000]
    ]
    /** @type {string} comma separated list of selected items, or an array of strings */
    let value = '0,2,3, 14-30, 100-200, 300-400, 500-600, 700-800, 900-4000, 4005-5020, 40000-50000'

</script>


<div class="multiselect-example">

    <MultiSelect {debug} {keeps} {behavior} {items} bind:value={value} {valueSeparator} valueByItemsIndex={true}
        label="MultiSelect with string value"
    >
        <slot slot="appDebugInfo" let:slotData>
            <slot name="appDebugInfo" {slotData} />
        </slot>
    </MultiSelect>

    <MultiSelect {debug} {keeps} {behavior} {items} bind:valueArray={valueArray} {valueSeparator} valueByItemsIndex={true}
        label="MultiSelect with valueArray"
    >
        <slot slot="appDebugInfo" let:slotData>
            <slot name="appDebugInfo" {slotData} />
        </slot>
    </MultiSelect>
</div>

<style>
    .multiselect-example {
        display: flex;
        flex-direction: row;
        gap: 20px;
        width: 100%;
    }
    .multiselect-example :global(.vs-multiselect-wrapper ) {
        width: 50%;
    }
</style>