<script>
	import MultiSelect from '../src/components/MultiSelect.svelte'


    import {createSequenceGenerator, randomString} from "./mock"
    /** @type {import('../src/index').TypeDebugVirtualScroll} */
    export let debug

    const getItemId = createSequenceGenerator()
    /** @type {number} */
    export let keeps

    /** @type {import('../src/virtual.js').KEEPS_BEHAVIOR} */
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

    /** @type {import('../src/components/MultiSelect.svelte').TypeItem[]} */
    const items = getItems(10000)
    /** @type {string} comma separated list of selected items, or an array of strings */
    let value = items.slice(0, 3).map(item => item.value).join(valueSeparator)
</script>


<div class="multiselect-example">

    <MultiSelect {debug} {keeps} {behavior} {items} bind:value={value} {valueSeparator} valueByItemsIndex={true}>
       <slot slot="appDebugInfo" let:slotData>
            <slot name="appDebugInfo" {slotData} />
       </slot>
    </MultiSelect>
</div>
