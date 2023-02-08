<script>
    import {afterUpdate, createEventDispatcher, onDestroy, onMount} from "svelte"
    import {defaultNameSpace} from "./virtual"
    import {joinClassNames} from "./lib"


    /**
     * @type {string} [tagName] - tagName of the item element
     */
    export let tagName = "div"

    /**
     * @type {string} [nameSpace] - BEM base class name
     */
    export let nameSpace = defaultNameSpace

    /**
     * @type {string | null} [className] - additional class name
     */
    export let className = null

    /**
     * @type {boolean} [horizontal] - horizontal mode
     */
    export let horizontal = false

    /**
     * @type {string} [uniqueKey] - unique key of the item
     */
    export let uniqueKey

    /**
     * @type {number | null} [index] - index of the item. null if the item is inside a header or footer slot
     */
    export let index = null

    /**
     * @type {import('./index').TypeItemType} [type] - type of the item
     */
    export let type = "item"

    // /**
    //  * @type {{ current: null | HTMLElement}} [ref]  - ref to the item element
    //  */
    // export let ref = {
    //     current: null
    // }

    /**
     * @type {ResizeObserver | null} [resizeObserver] - resize observer
     */
    let resizeObserver

    /**
     * @type {HTMLElement} [itemElement] - item element
     */
    let itemElement

    /**
     * @type {HTMLElement | undefined} [node] - item element for bind:node={parentVar}
     */
    export let node = undefined


    /** @type {import('./index').TypeResizeFnPassive | undefined | null} */
    export let onItemResizedPassive = null

    /**
     * @type {number} [previousSize] - previous size of the item
     */
    let previousSize

    const dispatch = createEventDispatcher()

    onMount(() => {
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(dispatchSizeChange)
            resizeObserver.observe(itemElement)
        }
    })

    afterUpdate(dispatchSizeChange)

    onDestroy(() => {
        if (resizeObserver) {
            resizeObserver.disconnect()
            resizeObserver = null
        }
    })

    const offsetKey = horizontal ? "offsetWidth" : "offsetHeight"


    function dispatchSizeChange() {
        const size = itemElement ? itemElement[offsetKey] : 0
        if (size === previousSize) return

        previousSize = size
        /** @type {import('./index').TypeResizeEventDetail} */
        const detail = {id: uniqueKey, size, type, index}
        if (typeof onItemResizedPassive === "function") {
            // console.time("onItemResizedPassive_" + uniqueKey)
            onItemResizedPassive && onItemResizedPassive(detail)

        } else {
            // console.time("dispatchSizeChange_" + uniqueKey)
            dispatch("resize", detail)
        }
    }

    // /** @param {HTMLElement} node - use:useRef */
    // function useRef(node) {
    //     if (typeof ref === "object" && ref && 'current' in ref) {
    //         ref.current = node
    //         return {
    //             destroy() { ref.current = null }
    //         }
    //     }
    // }

    $: node = itemElement

  </script>

  <svelte:element
    this={tagName}
    bind:this={itemElement}
    id="{nameSpace}-key-{uniqueKey}"
    class={joinClassNames(
        `${nameSpace}__${type}`,
        `${nameSpace}__${type}--${uniqueKey}`,
        className
    )}
    data-item-key="{uniqueKey}"
    {...$$restProps}
  >
    <slot/>
  </svelte:element>
