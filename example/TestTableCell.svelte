<script>
    /** @type {string | number} */
    export let height
    export let width = "auto"
    export let tagName = "td"
</script>

<svelte:element class="cell" this={tagName} style:height={height} style:width="{width}">
    <slot/>
</svelte:element>
