<script context="module">
    /** @typedef {{text: string, value: string | number, selected: boolean }} TypeItem */
</script>

<script>
    import {
        createRangeStringFromValues,
        createValuesFromRangeString,
    } from '../lib'


    import { onMount } from 'svelte'
    import VirtualScroll from "../VirtualScroll.svelte"
    /** @type {import('../../lib/index').TypeDebugVirtualScroll | undefined} */
    export let debug = undefined

    /** @type {number | undefined} */
    export let keeps = undefined

    /** @type {import('../../lib/virtual').KEEPS_BEHAVIOR | undefined} */
    export let behavior = undefined

    /** @type {string | undefined | null} */
    export let label = 'MultiSelect Component'

    /** @type {string | undefined} comma separated list of selected items, you can set custom separator by setting "valueSeparator" */
    export let value = ''

    /** @type {boolean | undefined} if true, instead of using comma separated "value", it will use the index of the selected items */
    export let valueByItemsIndex = false

    /** @type {string | undefined} used as separator for the "value" */
    export let valueSeparator = ','
    /** @type {boolean}  if true, it will use ranges for the selected items, highly recommended for large number of items
     *  note: works only when "valueByItemsIndex" or "option.value" is a number
     */
    export let valueUseRanges = true

    /** @type {TypeItem[]} option items {text: string, value: string | number, selected: boolean } */
    export let items = []

    /** @type {string | undefined} */
    export let id = 'multiselect-default-' + Math.random().toString(36).substr(2, 9)

    export let filterPlaceholder = 'Type to filter items'
    /** @type {string | undefined | null} */
    export let height = null

    export let sortSelectedFirst = false

    /** @type {string} the filter value */
    export let filterValue = ''


    /** @type {TypeItem[]} */
    let filteredItems = items

    /** @type {VirtualScroll} */
    let virtualScroll

    let mounted = false


    /** @param {string} value */
    const toggleItemSelected = (value) => {
        // console.time('MultiSelect: toggle item');

        const index = items.findIndex(item => item.value === value)
        if (index === -1) return
        items[index] = { ...items[index], selected: !items[index].selected }
        items = items.slice(0)

        // console.timeEnd('MultiSelect: toggle item')
    }

    /** @type {import('svelte/elements').MouseEventHandler<HTMLDivElement>} */
    const onItemClick = (e) => {
        const {value} = e.currentTarget.dataset
        if (value) toggleItemSelected(value)
    }
    /** @type {import('svelte/elements').KeyboardEventHandler<HTMLDivElement>} */
    const onItemKeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            const {value} = e.currentTarget.dataset
            if (value) toggleItemSelected(value)
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            const current = e.currentTarget.parentElement
            if (!current) return
            const next = /** @type {HTMLElement} */ (
                (e.key === 'ArrowDown'
                    ? current.nextElementSibling
                    : current.previousElementSibling
                )?.querySelector('.multiselect-item')
            )
            if (next) next.focus()
        }
    }


    const selectAll = () => {
        items = items.map(item => ({ ...item, selected: true }))
    }

    const unselectAll = () => {
        items = items.map(item => ({ ...item, selected: false }))
    }

    const getSortedItems = (function() {
        /**
         * @param {TypeItem} a
         * @param {TypeItem} b
        */
        const sortFn = (a, b) => {
            if (a.selected === b.selected) return 0
            return a.selected ? -1 : 1
        }
        return () => items.sort(sortFn)
    })();


    const setInitialSelections = () => {
        // console.time('MultiSelect: set initial selections')
        if (value && typeof value === 'string') {
            const separator = valueSeparator ?? ','
            const selectedValues = valueUseRanges
                ? createValuesFromRangeString(value, separator)
                : value.split(separator)
            // console.log('setInitialSelections: selectedValues', selectedValues)
            for (let i = 0; i < items.length; i++) {
                const {value, selected = false} = items[i]

                const newSelected =
                    valueByItemsIndex
                        ? selectedValues.indexOf(
                             /** @type {never} */ (i)
                        ) > -1
                        : selectedValues.includes(
                            /** @type {never} */ (value)
                        )
                if (newSelected !== selected) {
                    items[i] = { ...items[i], selected: newSelected }
                }
            }
            items = items.slice(0)
        }
        // console.timeEnd('MultiSelect: set initial selections')
    }

    onMount(() => {
        if (!mounted) {
            setInitialSelections()
            mounted = true
        }
    })

    $: {
        // console.time('MultiSelect: filter items')
        const filterVal = filterValue.trim().toLowerCase()
        const itemsSorted = sortSelectedFirst ? getSortedItems() : items

        if (filterVal === '') {
            filteredItems = itemsSorted
        } else {
            filteredItems = itemsSorted.filter(item => (
                item.text.trim().toLowerCase().includes(filterVal) || // search in text
                item.value.toString().includes(filterVal) // search in value
            ))
        }
        // console.timeEnd('MultiSelect: filter items')
    }

    $: selectedItems = items.filter(item => item.selected)


    $: {
        if (mounted) {
            // console.time('MultiSelect: set value')
            const separator = valueSeparator ?? ','
            const values = []
            for (let i = 0; i < items.length; i++) {
                if (items[i].selected) {
                    values.push(valueByItemsIndex ? i : items[i].value)
                }
            }
            //
            if (valueUseRanges && (
                valueByItemsIndex || typeof items[0].value === 'number'
            )) {
                value = createRangeStringFromValues(values, separator)
            }
            else {
                value = values.join(separator)
            }

            // console.timeEnd('MultiSelect: set value')
        }
    }

    // $: { if (virtualScroll) virtualScroll.resetSizes() }

</script>



<div class="vs-multiselect-wrapper">
    <slot name="label" {label}>
        {#if label}
            <label class="vs-multiselect-label" for={id}>
                {label}
            </label>
        {/if}
    </slot>
    {#if debug}
        <input type="text" readonly name="{id}-selectedItems"  bind:value={value} class="debug-input" title="debug view of hidden input value" />
    {:else}
        <input type="hidden" name="{id}-selectedItems"  bind:value={value} />
    {/if}
    <div class="vs-multiselect-filter-search">
        <slot name="filter-search" {filterValue} {items} {filteredItems} {selectedItems} {selectAll} {unselectAll} {toggleItemSelected} {value} {valueSeparator}>
            <label for="filter"><slot name="filter-label">Filter:</slot></label>
            <input type="search" id="filter" bind:value={filterValue} aria-controls={id} placeholder={filterPlaceholder} />
        </slot>
    </div>
    <div class="vs-multiselect-filter-selections">
        <slot name="filter-selections" {filterValue} {items} {filteredItems} {selectedItems} {selectAll} {unselectAll} {toggleItemSelected} {value} {valueSeparator}>
            <div class="selected-count">
                <slot name="selected-count" {selectedItems} {items}>
                    Selected: {selectedItems.length} / {items.length}
                </slot>
            </div>
            <div class="links">
                <button
                    disabled={selectedItems.length >= items.length}
                    on:click={selectAll}
                ><slot name="selected-all">Select All</slot>
                </button>
                <button on:click={unselectAll}
                    disabled={selectedItems.length === 0}
                ><slot name="unselect-all">Clear</slot>
                </button>
            </div>
        </slot>
    </div>
    <div class="vs-multiselect-options" style:--vs-multiselect-options-height={height}>
        <VirtualScroll
            bind:this={virtualScroll}
            ariaRole={'options'}
            id={id}
            debug={debug}
            data={filteredItems}
            key="value"
            keeps={keeps}
            keepsBehavior={behavior}
            {...$$restProps}
            let:data
            let:index
        >
            <!-- <this slot is used to render debug info, no need to use it in production -->
            <div slot="beforeList" let:slotData><slot name="appDebugInfo" {slotData} /></div>

            <div slot="empty">
                <slot name="empty" {items} {filteredItems} {selectedItems} {selectAll} {unselectAll}>
                    <div class="vs-multiselect-empty-text">
                        {#if items.length > 0 && filteredItems.length === 0}
                            No matches found for the filtered text.
                        {:else if items.length === 0}
                            There are no options to select.
                        {/if}
                    </div>
                </slot>
            </div>

            <div class="vs-multiselect-item"
                class:vs-multiselect-item--selected={data.selected}
                tabindex="0"
                on:click={onItemClick}
                on:keydown={onItemKeydown}
                data-value={data.value}
                aria-selected={data.selected}
                aria-label={data.text}
                role="option"
            >
                <slot {data} {selectedItems} {value} {valueSeparator} {toggleItemSelected} {selectAll} {unselectAll}>
                    <div class="vs-multiselect-item__checkbox">
                        <slot name="item-icon" {data}>
                            <input type="checkbox" class="x" checked={data.selected} tabindex="-1" aria-hidden="true" />
                        </slot>
                    </div>
                    <div class="vs-multiselect-item__text">
                        <slot name="item-text" {data}>
                            {#if debug}
                                <small class="debug-index">index: {index.toString().padStart((items.length + '').length , '0')}</small>
                            {/if}
                            {data.text}
                        </slot>
                    </div>
                </slot>
            </div>
        </VirtualScroll>
    </div>
</div>

<style>
    .vs-multiselect-wrapper :global(.virtual-scroll--view-list .virtual-scroll__item ) {
        padding: 0px;
        box-sizing: border-box;
    }
    .vs-multiselect-label {
        font-weight: bold;
        padding: 0.5rem 1rem;
        background-color: #f9f9f9;
    }

    .vs-multiselect-filter-selections {
        padding: 0.25rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #eee;
    }
    .vs-multiselect-filter-selections .selected-count {
        font-size: 0.875rem;
    }

    .vs-multiselect-filter-search {
        padding: 0.5rem 1rem 0rem 1rem;
        background-color: #eee;
        display: flex;
        align-items: center;
    }
    .vs-multiselect-filter-search label {
        margin-right: 0.5rem;
        font-size: 0.875rem;
    }
    .vs-multiselect-filter-search input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ccc;
        width: 100%;
        border-radius: 0.25rem;
    }

    .vs-multiselect-filter-selections .links button {
        margin-left: 0.5rem;
        background: transparent;
        border: 0 none;
        font-size: 0.875rem;
        padding: 0.5rem 0.25rem;
        cursor: pointer;
        text-decoration: underline
    }

    .vs-multiselect-filter-selections .links button:disabled {
        color: #999;
        cursor: not-allowed;
    }
    .vs-multiselect-filter-selections .links button:disabled:hover {
        text-decoration: none;
    }
    .vs-multiselect-filter-selections .links button:focus-visible {
        outline: 1px solid #333;
        outline-offset: 4px;
    }


    .vs-multiselect-wrapper {
        max-width: 500px;
        display: flex;
        flex-direction: column;
        background-color: #fff;
        color: #333;
    }

    .vs-multiselect-options {
        height: var(--vs-multiselect-options-height, 300px);
        max-width: 100%;

    }

    .vs-multiselect-item input[type="checkbox"] {
        width: 1.25em;
        height: 1.25em;
        display: inline-block;
        user-select: none;
        pointer-events: none;
    }

    .vs-multiselect-item {
        display: flex;
        align-items: center;
        padding: 1rem 1rem;
        border-bottom: 1px solid #ccc;
        cursor: pointer;
    }

    .vs-multiselect-item--selected {
        background-color: lightgoldenrodyellow;
    }
    .vs-multiselect-item__checkbox {
        margin-right: 1rem;
        display: flex;
        align-items: center;
    }

    .vs-multiselect-item__text {
        flex: 1;
        display: flex;
        align-items: center;
    }


    .vs-multiselect-empty-text {
        font-style: italic;
        padding: 2em;
        text-align: center;
    }
    .debug-index {
        font-size: 0.75rem;
        color: #999;
        margin-right: 0.5rem;
    }
    .debug-input {
        font-size: 0.875rem;
        border: 1px solid #888;
        margin: 0 1rem;
        padding: 0 0.5rem;
        background-color: #ccc;
    }
</style>
