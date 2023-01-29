<script>
    /**
     * @typedef {string | number} cssSizeValue
     */

    /** @type {string | number} */
    export let uniqueKey = "missing key"

    /** @type {cssSizeValue | null} */
    export let minHeight = null

    /** @type {cssSizeValue | null} */
    export let minWidth = null

    /** @type {cssSizeValue | null} */
    export let height = null

    /** @type {cssSizeValue | null} */
    export let width = null

    /** @type {cssSizeValue | null} */
    export let size = null

    export let horizontalMode = false

    $: {

        if (size) {
            if (horizontalMode) {
                width = size + "px"
                height = null
            } else {
                width = null
                height = size + "px"
            }
        }
    }
</script>

<div
    class={horizontalMode ? "hoz" : "ver"}
    style:height={height}
    style:width={width}
    style:min-width={minWidth}
    style:min-height={minHeight}
>
    key: {uniqueKey} |
    {horizontalMode ? width : height}
</div>

<style>
    div {
        /* Don't set margin top and bottom together! It will break size counting */
        padding: 8px;
        color: black;
        background-color: #ccc;
        border-radius: 20px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
