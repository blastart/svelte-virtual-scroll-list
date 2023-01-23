<script>
    import {afterUpdate, createEventDispatcher, onDestroy, onMount} from "svelte"
    import {joinClassNames, defaultNameSpace} from "./virtual"


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

    /**
     * @type {{ current: null | HTMLElement}} [ref]  - ref to the item element
     */
    export let ref = {
        current: null
    }

    /**
     * @type {ResizeObserver | null} [resizeObserver] - resize observer
     */
    let resizeObserver

    /**
     * @type {HTMLElement} [itemElement] - item element
     */
    let itemElement

    /**
     * @type {number} [previousSize] - previous size of the item
     */
    let previousSize

    const dispatch = createEventDispatcher()
    const shapeKey = horizontal ? "offsetWidth" : "offsetHeight"

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

    function dispatchSizeChange() {
        const size = itemElement ? itemElement[shapeKey] : 0
        if (size === previousSize) return
        previousSize = size
        /** @type {import('./index').TypeResizeEventDetail} */
        const detail = {id: uniqueKey, size, type, index}
        dispatch("resize", detail)
    }

    /** @param {HTMLElement} node */
    function useRef(node) {
        if (typeof ref === "object" && ref && 'current' in ref) {
            ref.current = node
            return {
                destroy() { ref.current = null }
            }
        }
    }

  </script>

  <svelte:element
    this={tagName}
    bind:this={itemElement}
    use:useRef
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
