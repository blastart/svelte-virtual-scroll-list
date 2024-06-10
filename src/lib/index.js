import VirtualScroll from './VirtualScroll.svelte'
import MultiSelect from './components/MultiSelect.svelte'
export { VirtualScroll, MultiSelect }
export  * from './lib'

export default VirtualScroll;

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
 * @typedef {(details: TypeResizeEventDetail, _native?: boolean) => void } TypeResizeFnPassive
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


/** @typedef {import('../lib/virtual').TypeDebugOptions & { others?: Record<string, boolean>}} TypeDebugVirtualScroll */


/**
 * Every time when the list is rendered, the slotData is updated, this causes an update of any slot where the slotData exposed.
 * To reduce unnecessary updates, you can list here only the necessary slot names where the slotData is really used.
 * @example bindSlotDataTo={['header', 'footer']} // only bind slotData to header and footer slots
 * @typedef {('beforeList' | 'afterList' | 'header' | 'footer' | 'empty')[] } TypeBindSlotDataTo
 */