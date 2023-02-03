<script>
    /** @type {string | number} */
    export let height
    export let width = "auto"
    export let tagName = "td"
</script>

<svelte:element class="cell" this={tagName}>
    <div class="cell-inner" style:min-height={height} style:min-width="{width}">
        <slot/>
    </div>
</svelte:element>

<style>
    .cell-inner {
        padding: 10px 5px;
        box-sizing: border-box;
    }
</style>
