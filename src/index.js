import VirtualScroll from "./VirtualScroll.svelte"

/**
 * @typedef {"item" | "slot"} TypeItemType
 */

/**
 * @typedef {number | string} TypeUniqueKey
 */

/**
 * @typedef {Object} TypeResizeEventDetail
 * @property {TypeUniqueKey} id - unique key of the item
 * @property {number} size - size of the item
 * @property {number | null} [index] - index of the item
 * @property {TypeItemType} type - type of the item
 */


/**
 * @typedef {UIEvent & {detail: TypeResizeEventDetail}} TypeResizeEvent
 */

/**
 * @typedef TypeElementProps
 * @type {Object}
 * @property {string} [className] - className of element.
 * @property {string} [tagName] - tagName of element.
 */


/**
 * @typedef TypeDataItem
 * @type {Object<string, any>} Source item data.
 */


/** @typedef {import('./virtual').TypeDebugOptions & { others?: Record<string, any>}} TypeDebugVirtualScroll */

export {VirtualScroll}
export default VirtualScroll
