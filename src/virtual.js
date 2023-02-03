import {getObjChangesByKeys, margeDefinedProps, debounceFn, arrayChunk} from './lib.js'
// import { rifFn} from './lib.js'


/**
 * @typedef {0 | 1 | 2} TypeLogEfficiency
 * 0 - no log
 * 1 - log  major efficient improvements
 * 2 - log  major & minor improvements
*/

/** @type {TypeLogEfficiency} - logEfficiency */
let logEfficiency = 0


/**
 * @typedef {0 | 1 | 2} TypeLogInfo
 * 0 - no log
 * 1 - log  major info
 * 2 - log  major & minor info
*/

/** @type {TypeLogInfo} - logEfficiency */
let logInfo = 0


/** @type {boolean} - logEfficiency */
let logErrors = true


/**
 * @typedef {boolean | {
 *  efficiency?: TypeLogEfficiency,
 *  info?: TypeLogInfo,
 *  logErrors?: boolean
 * }} TypeDebugOptions
*/

/**
 * @param {TypeDebugOptions}  options
*/

export const setDebug = (options) => {
    if (typeof options === 'boolean') {
        logEfficiency = options ? 1 : 0
        logInfo = options ? 1 : 0
        // logErrors = options // log error enabled by default
        // to disable log errors use setDebug({logErrors: false})
        return
    }
    if (typeof options.efficiency === 'number') {
        if (options.efficiency >= 0 || options.efficiency <= 2) {
            logEfficiency = options.efficiency
        }
    }
    if (typeof options.info === 'number') {
        if (options.info >= 0 || options.info <= 2) {
            logInfo = options.info
        }
    }
    if (typeof options.logErrors === 'boolean') {
        logErrors = options.logErrors
    }

}

export const getDebug = () => ({
    logEfficiency,
    logInfo,
    any: !!(logEfficiency || logInfo)
})

export const defaultNameSpace = 'virtual-scroll'

export const browser = typeof window !== "undefined"



/**
 * contains the calculated range of the items to render
 * @typedef {{
 *  start: number,
 *  end: number,
 *  padFront: number,
 *  padBehind: number
 * }} TypeRange

/**
 * @typedef {string | number} TypeUniqueId
 */

/**
 * Scroll to position call to be applied on the current scollable container.
 * @typedef {(position: TypeScrollPos) => void} TypeScrollToFn
 */

/**
 * items to render in addition to the keeps. recommend for a third of keeps
 * @typedef {number} TypeBuffer - buffer
 */
/**
 * how many items to keep in the DOM
 * @typedef {number} TypeKeeps - keeps
 */
/**
 * estimate size of the item
 * @typedef {number} TypeEstimateSize - estimateSize
 */
/**
 * behaviour of the keeps calculation
 * @typedef {KEEPS_BEHAVIOUR} TypeKeepsBehaviour - keepsBehaviour
 */
/**
 * Maximum fill height, prevents infinite cycles if the parent element has no height set
 * @typedef {number} TypeFillMaxSize -
 */
/**
 * Viewport multiplier. According to keepsBehavior, it increases the size of the viewport to be filled with elements in order to ensure smooth scrolling even when scrolling fast. The value of "keeps" increases in proportion to the viewport.
 * @typedef {number} TypeFillSizeMultiplier - fillSizeMultiplier
 */
/**
 * size of the header slot
 * @typedef {number} TypeSlotHeaderSize - slotHeaderSize
 */
/**
 * size of the footer slot
 * @typedef {number} TypeSlotFooterSize - slotFooterSize
 */
/**
 * in vertical mode, offset left, otherwise offset top of the root element (eg: root.getBoundingClientRect().top + window.pageYOffset)
 * @typedef {number} TypePageModeOffset - pageModeOffset
 */
/**
 * update the average size of items after each scroll
 * @typedef {boolean} TypeAutoUpdateAverageSize - autoAutoUpdateAverageSize
 */

/**
 * Required parameters for the virtual class
 * @typedef {{
 *  uniqueIds: TypeUniqueId[],
 *  scrollTo: TypeScrollToFn,
 * }} TypeParamRequired
*

/**
 * Optional parameters for the virtual class
 * @typedef {{
 * buffer: TypeBuffer,
 * keeps: TypeKeeps,
 * estimateSize: TypeEstimateSize,
 * keepsBehaviour: TypeKeepsBehaviour,
 * fillMaxSize: TypeFillMaxSize,
 * fillSizeMultiplier: TypeFillSizeMultiplier,
 * slotHeaderSize: TypeSlotHeaderSize,
 * slotFooterSize: TypeSlotFooterSize,
 * pageModeOffset: TypePageModeOffset,
 * autoAutoUpdateAverageSize: TypeAutoUpdateAverageSize
 * }} TypeParamOptional
*/


/**
 * Virtual class constructor parameters
 * @typedef {TypeParamRequired & TypeParamOptional} TypeParam
*/

/**
 * Virtual class init parameters
 * @typedef {TypeParamRequired | TypeParamOptional} TypeParamForInit
*/

/**
 * scroll position of the root or document element depending on view modes
 * @typedef {number} TypeScrollPos
*/

/**
 * client size of the root or document element depending on view modes
 * @typedef {number} TypeClientSize
*/

/**
 * scroll size of the root or document element depending on view modes
 * @typedef {number} TypeScrollSize
*/

/**
 * callback to be passed to init method, will be called for all changes that require rendering
 * @typedef {(clientSize: TypeClientSize) => void} TypeAfterRenderFn
*/

/**
 * Virtual.init  to be called after each range calculation
 * @typedef {(this: Virtual, rng: TypeRange, afterRender: TypeAfterRenderFn) => void | null} TypeCallUpdateFn
*/



/**
 * direction values
 * @enum {string}
 * @readonly
*/
const DIRECTION_TYPE = {
    FRONT: "FRONT", // scroll up or left
    BEHIND: "BEHIND" // scroll down or right
}
/**
 * Type of calculation since for last initialisation
 * @readonly
 * @enum {string}
 * @property {string} INIT - initial value when no size calculation has been saved
 * @property {string} FIXED - the items already rendered included only elements of the same size.
 * @property {string} DYNAMIC - the items already rendered included elements of different sizes.
*/
const CALC_TYPE = {
    INIT: "INIT",
    FIXED: "FIXED",
    DYNAMIC: "DYNAMIC"
}

const BUFFER_TESTRATIO = 1

const LEADING_BUFFER = 1
/** minimum number of items to render */
export const MIN_KEEPS = 3

/**
 * behaviour options to calculate the number of items to render
 * @readonly
 * @enum {string}
 * @property {string} AS_IS         - uses the value set in params.
 *
 * @property {string} AUTO_INCREASE - increments the value set in param.keeps until the rendered
 *                                    range becomes larger than the viewport.
 *
 * @property {string} AUTO_ADJUST   - Increments/decrements the value set in params according
 *                                    to the size of the viewport. This may cause more rendering
 *                                    cycles, especially for non-fixed size elements, but it always
 *                                    renders a sufficient number of elements to fill the viewport
 *
 * @property {string} ACCURATE      - Renders an exact number of items to fill the viewport in each
 *                                    range changes. This is the most accurate option but it casuses
 *                                    more re-renders than the other options.
*/
export const KEEPS_BEHAVIOUR = {
    AS_IS: "as-is",
    AUTO_INCREASE: "auto-increase",
    AUTO_ADJUST: "auto-adjust",
    ACCURATE: "accurate"
}

const logMsgs = {
    paramIsNull: 'param is not yet initialized',
    paramInvalidVal: 'invalid param value',
    paramInvalidKey: 'invalid param key'
}

/** @type {TypeParamOptional} */
export const defaults = {
    keeps: 30,
    keepsBehaviour: KEEPS_BEHAVIOUR.AUTO_ADJUST,
    slotHeaderSize: 0,
    slotFooterSize: 0,
    pageModeOffset: 0,
    fillSizeMultiplier: 2,
    fillMaxSize: 10000,
    autoAutoUpdateAverageSize: false,
    estimateSize: 50,
    buffer: 10
}

class Virtual {
    /** @type {TypeParam | null} */
    param = null


    /** @type {TypeCallUpdateFn | null} */
    callUpdate = null
    /** @type {boolean | null} */
    firstRangeAvgCalculated = false

    averageSize = 0
    /** @type {Map<number | string, number>} */
    sizes = new Map()

    fixedSizeValue = 0

    /** the number of items to render in addition to the keeps based on the keepsBehaviour */
    keepsCalculated = 0

    calcType = CALC_TYPE.INIT

    /** @type {TypeScrollPos} scroll position */
    scrollPos = 0
    /** @type {TypeScrollPos} scroll position without the pageModeOffset */
    scrollPosRaw = 0
    /** @type {TypeClientSize} */
    clientSize = 0
    /** @type {TypeScrollSize} */
    scrollSize = 0

    /** @type {DIRECTION_TYPE} */
    direction = ""

    /** @type {number} how many times the handleDataSizeChange method has been called */
    dataChanges = 0

    /** @type {TypeRange} */
    range = Object.create(null)

    lastAverage = {
        start: 0,
        end: 0
    }

    lastIndexOffset = {
        givenIndex: 0,
        offset: 0,
        calcIndex: 0
    }

    /**
     * keep track of the last values of scrollPos, param, etc. beetwen checkRendered calls
     * @type {{
     * range: TypeRange,
     * param: TypeParam | null,
     * dataChanges: number,
     * clientSize: TypeClientSize,
     * scrollPos: TypeScrollPos,
     * scrollPosRaw: TypeScrollSize,
     * scrollSize: TypeScrollSize,
     * rangeSize: number
     * }}
    */
    last = {
        range: {start: 0, end: 0, padFront: 0, padBehind: 0},
        param: null,
        dataChanges: 0,
        clientSize: 0,
        scrollSize: 0,
        scrollPosRaw: 0,
        scrollPos: 0,
        rangeSize: 0
    }

    /** @type {TypeScrollPos[]} helps prevent scroll loop if an element overflows */
    _scrollPosHistory = []

    /** this.range[key] is compared to this.last.range[key] */
    eqRangeKeys = ["start", "end", "padFront", "padBehind"]

    /**  this.param[key] is compared to this.last.param[key] */
    eqParamKeys = ["uniqueIds", ...Object.keys(defaults)]
    /** this[key] is compared to this.last[key]
     * @type {Array<keyof Virtual>}
     */
    eqSelfKeys = ["clientSize", "scrollSize", "scrollPos", "scrollPosRaw", "dataChanges"]


    /**
     * @param {TypeParamForInit} param
     * @param {TypeCallUpdateFn} callUpdate
     */
    constructor(param, callUpdate) {

        /** @type {(...args: unknown[]) => unknown}  */
        this.logError = logErrors && browser && console?.error
            ? console.error.bind(window.console, defaultNameSpace + ':')
            : () => {}

        this.init(param, callUpdate)
    }

    /**
     * @param {TypeParamForInit | null} param
     * @param {TypeCallUpdateFn | null} callUpdate
     * @param {CALC_TYPE} [_calcType]
     */
    init(param, callUpdate, _calcType) {
        // param data
        /** @type {TypeParam | null} */
        this.param = Object.assign({
            ...defaults,
            scrollTo: () => this.logError("scrollTo function is not defined in param"),
            uniqueIds: []
            // TODO: validate params using updateParam()
        }, (margeDefinedProps(param || {})))
        this.callUpdate = callUpdate
        this.bufferCalculated = this.param?.buffer || defaults.buffer
        // size data
        this.sizes = new Map()
        this.firstRangeAvgCalculated = false
        this.averageSize = 0

        this.fixedSizeValue = 0
        this.calcType = _calcType || CALC_TYPE.INIT

        // scroll data
        this.scrollPos = 0
        this.direction = ""

        // range data
        this.range = Object.create(null)
        if (param) {
            this.checkRange(0, this.getKeepsCalculated() - 1)
        }

        // benchmark example data
        // this.__bsearchCalls = 0
        // this.__getIndexOffsetCalls = 0
    }
    /**
     * @type {TypeAfterRenderFn} clientSize
     */
    afterRenderCallback = (clientSize) => {
        this.clientSize = clientSize
        this.checkRendered()
    }

    // rifUpdateCalculations = rifFn(/** @type {(this: Virtual) => void} */ function() {
    //     if (this.param?.autoAutoUpdateAverageSize) {
    //         this.calcAverageSize(false, true) // recalculate average size when scrolling to front
    //         logInfo && console.error("recalculate average size when scrolling to front")
    //     }
    // })

    debounceUpdateCalculations = debounceFn(/** @type {(this: Virtual) => void} */ function() {
        if (this.param?.autoAutoUpdateAverageSize) {
            this.calcAverageSize(false, true) // recalculate average size when scrolling to front
        }
    }, 1000)

    reset() {
        if (this.param && this.callUpdate) {
            this.init(this.param, this.callUpdate, this.calcType)
        }
    }

    destroy() {
        this.init(null, null)
    }

    /**
     * @returns {TypeRange}
     */
    getRange() {
        const range = Object.create(null)
        range.start = this.range.start
        range.end = this.range.end
        range.padFront = this.range.padFront
        range.padBehind = this.range.padBehind
        return range
    }

    isBehind() {
        return this.direction === DIRECTION_TYPE.BEHIND
    }

    isFront() {
        return this.direction === DIRECTION_TYPE.FRONT
    }

    getFrontSize() {
        if (typeof this.param?.pageModeOffset === "number" && this.param.pageModeOffset > 0) {
            return this.param.pageModeOffset + this.param?.slotHeaderSize ?? 0
        }
        return this.param?.slotHeaderSize ?? 0
    }


    /**
     * @param {TypeUniqueId[]} uniqueIds
     */
    setUniqueIds(uniqueIds) {
        if (!this.param) {
            this.logError('setUniqueIds()', logMsgs.paramIsNull)
            return
        }

        if (Array.isArray(uniqueIds)) {
            this.param.uniqueIds = uniqueIds
            this.cleanSizes()

        } else {
            this.logError('setUniqueIds()', logMsgs.paramInvalidVal, uniqueIds)
        }
    }

    /**
     * @param {number} value
     * @param {string} [_log] debuggin info
     */
    setPageModeOffset(value, _log) {
        if (!this.param) {
            this.logError('setPageModeOffset()', logMsgs.paramIsNull)
            return
        }
        if (typeof value !== "number" || !isFinite(value))  {
            this.logError('setPageModeOffset()', logMsgs.paramInvalidVal, value)
            return
        }
        const newVal = Math.round(value)

        if (newVal === this.param.pageModeOffset) return

        this.param.pageModeOffset = newVal
        this.handleFront(false, 'setPageModeOffset ' + _log)
        // this.handleBehind(false, 'setPageModeOffset ' + _log)
    }

    /**
     * @param {keyof TypeParam} key
     * @param {unknown} value
     */
    updateParam(key, value) {
        if (!this.param) {
            this.logError('updateParam()', logMsgs.paramIsNull)
            return
        }
        const from = this.param[key]

        switch (key) {
            case "uniqueIds": {
                if (Array.isArray(value)) this.setUniqueIds(value)
                break
            }
            case "keepsBehaviour": {
                if (typeof value === "string") this.setKeepsBehaviour(value)
                break
            }
            case "pageModeOffset": {
                if (typeof value === "number") this.setPageModeOffset(value, 'updateParam')
                break
            }
            case "keeps": {
                if (typeof value === "number") this.setKeeps(value)
                break
            }
            case "autoAutoUpdateAverageSize": {
                if (typeof value === "boolean") {
                    this.param[key] = value
                } else {
                    this.logError('updateParam()', logMsgs.paramInvalidVal, key, value,
                        'use boolean instead'
                    )
                }
                break
            }
            case "estimateSize":
            case "buffer":
            case "fillSizeMultiplier":
            case "fillMaxSize":
            case "slotHeaderSize":
            case "slotFooterSize":{
                if (typeof value !== "number" || !isFinite(value))  {
                    this.logError('updateParam()', logMsgs.paramInvalidVal, key, value,
                        'use number instead'
                    )
                    break
                }
                this.param[key] = Math.max(value, 0)
                break
            }
            default: {
                this.logError('updateParam', logMsgs.paramInvalidKey, key)
                break
            }
        }
        logInfo && console.info('info: updateParam()', {key, from, to: value, params: {...this.param}})
    }

    getBuffer(minBuffer = LEADING_BUFFER) {
        const buffer = this.param?.buffer ?? Math.ceil(this.getKeeps() / 3)
        return Math.max(buffer, minBuffer)
    }

    /**
     * @returns {number} calculated buffer value based on current keepsBehaviour calculation
    */
    getBufferCalculated(minBuffer = LEADING_BUFFER) {
        if (!this.param || this.param.keepsBehaviour === KEEPS_BEHAVIOUR.AS_IS) {
            // if keepsBehaviour is "as-is", we don't calculate buffer
            return this.getBuffer()
        }
        const keeps = this.getKeepsCalculated()
        const value = Math.ceil(keeps / 3)
        return Math.max(value, minBuffer)
    }

    setKeeps(value = defaults.keeps) {
        if (!this.param) return
        this.param.keeps = Math.max(value, MIN_KEEPS)
        this.setKeepsCalculated(value)
        this.checkRange(this.range.start, this.range.end)
    }

    /**
     * @returns {number} param.keeps value
     */
    getKeeps() {
        return Math.max(this.param?.keeps ?? defaults.keeps, MIN_KEEPS)
    }

    /** @param {KEEPS_BEHAVIOUR} value */
    setKeepsBehaviour(value) {
        if (!this.param) return

        const validValues = Object.values(KEEPS_BEHAVIOUR)
        if (typeof value === "string" && validValues.includes(value)) {
            if (value === this.param.keepsBehaviour) return
            this.param.keepsBehaviour = value
            this.firstRangeAvgCalculated = false
            this.checkRange(this.range.start, this.range.end)
        } else {
            this.logError('updateParam()', logMsgs.paramInvalidVal, 'keepsBehaviour', value,
                'should use one of these:', validValues.join(', ')
            )
        }
    }



    /**
     * @returns {number} calculated keeps value based on current keepsBehaviour calculation
     */
    getKeepsCalculated() {
        if (!this.param || this.param.keepsBehaviour === KEEPS_BEHAVIOUR.AS_IS) {
            // if keepsBehaviour is "as-is", we don't calculate keeps
            return this.getKeeps()
        }
        return Math.max(this.getKeeps(), this.keepsCalculated)
    }

    /**
     *  @param {number} value
     */
    setKeepsCalculated(value) {
        if (value > MIN_KEEPS) this.keepsCalculated = value
    }

    /** save each size map by id
     * @param {import('./index').TypeUniqueKey} id
     * @param {number} size
     */
    saveSize(id, size) {
        if (!this.param) return

        this.sizes.set(id, size)

        // we assume size type is fixed at the beginning and remember first size value
        // if there is no size value different from this at next coming saving
        // we think it's a fixed size list, otherwise is dynamic size list
        if (this.calcType === CALC_TYPE.INIT) {
            this.fixedSizeValue = size
            this.calcType = CALC_TYPE.FIXED
        } else if (this.calcType === CALC_TYPE.FIXED && this.fixedSizeValue !== size) {
            this.calcType = CALC_TYPE.DYNAMIC
            this.fixedSizeValue = 0
        }

        this.calcAverageSizeOnce()
    }

    resetSizes() {
        this.sizes.clear()
        this.firstRangeAvgCalculated = false
        this.fixedSizeValue = 0
        this._scrollPosHistory.splice(0, this._scrollPosHistory.length)
        this.calcType = CALC_TYPE.INIT
    }

    /** if uniqueIds change, find out deleted id and remove from size map */
    cleanSizes() {
        const uniqueIds = this.param?.uniqueIds

        if (!Array.isArray(uniqueIds) || uniqueIds.length === 0) return

        this.sizes.forEach((v, key) => {
            if (Array.isArray(uniqueIds) && !uniqueIds.includes(key)) {
                this.sizes.delete(key)
            }
        })
    }

    /**
     * calculates the average size of all items that have been rendered.
     * @param {boolean} force force to calculate average size even if the range is not full
     * @param {boolean} updateRange update range if average size is changed
     */

    calcAverageSize(force = false, updateRange = false) {
        if (this.calcType === CALC_TYPE.FIXED) {
            return this.fixedSizeValue
        }
        const rangeNotChanged = ( // do not calculate the average size without a range change
            this.lastAverage.start === this.range.start && this.lastAverage.end === this.range.end
        )

        // don't calculate average size if the range is not full
        if (force || (!rangeNotChanged && this.sizes.size > Math.min(this.getKeepsCalculated(), this.getLength()))) {
            const sizes = [...this.sizes.values()]
            const oldAverageSize = this.averageSize

            let totalSize = 0
            let i = sizes.length
            while (i--) totalSize += sizes[i]

            this.averageSize = Math.round(totalSize / sizes.length) || 0
            const diff =  oldAverageSize - this.averageSize
            if (oldAverageSize !== this.averageSize) {
                if (!force) { // calcAverageSizeOnce not finished
                    logInfo && console.info('info: calcAverageSize() changed', diff)
                    updateRange && this.updateRange(this.range.start, this.range.end)
                }
            }
            this.lastIndexOffset.calcIndex = 0
            this.lastAverage.start = this.range.start
            this.lastAverage.end = this.range.end
            return this.averageSize
        }
        return 0
    }


    calcAverageSizeOnce() {
        if (!this.param) return
        // calculate the average size only in the first range
        if (this.calcType !== CALC_TYPE.FIXED && this.firstRangeAvgCalculated !== true) {
            // logInfo && console.log('calcAverageSizeOnce')
            if (this.sizes.size <= Math.min(this.getKeepsCalculated(), this.getLength())) {
                this.calcAverageSize(true)
                logInfo && console.info('info: calcAverageSizeOnce() DONE', this.averageSize)
            } else {
                this.firstRangeAvgCalculated = true
            }
        }
    }


    /**
     * in some special situation (e.g. length change) we need to update in a row
     * try going to render next range by a leading buffer according to current direction
    */
    handleDataSourcesChange(log = 'n/a') {
        let start = this.range.start
        let where = 'center'

        if (this.isFront()) {
            // start = start - LEADING_BUFFER
            start = start - this.getBufferCalculated()
            where = 'front'
        } else if (this.isBehind()) {
            // start = start + LEADING_BUFFER
            start = start + this.getBufferCalculated()
            where = 'behind'
        }

        // start = Math.max(start, 0)
        start = Math.min(Math.max(start, 0), this.getLastIndex())

        logInfo && console.log("info: handleDataSourcesChange()", log, {start, where})

        this.dataChanges += 1

        this.updateRange(this.range.start, this.getEndByStart(start))
        requestAnimationFrame(() => {
            this.handleFront()
            this.handleBehind()
            this.handleScroll(this.scrollPos, this.clientSize, this.scrollSize, true)
        })

    }

    /**
     * detect scroll loop
     * @param {TypeScrollPos} scrollPos
     * @param {TypeClientSize} clientSize
     * @param {TypeScrollSize} scrollSize
     * @param {boolean} [forceChange]
    */
    detectScrollLoop(scrollPos, clientSize, scrollSize, forceChange = false) {
        const shLen = this._scrollPosHistory.length
        const cyles = 6 // must be even number

        if (shLen >= cyles) {
            logInfo > 1 && console.log('info: detectScrollLoop()', this._scrollPosHistory, scrollPos)

            if (
                arrayChunk(this._scrollPosHistory, 2).every(chunk => (
                    // all odd elements match the current position in 6 (cyles) update cycles
                    chunk[0] === scrollPos && chunk[1] !== scrollPos
                ))
            ) {
                this.logError(
                    'detectScrollLoop()',
                    'scroll loop detected. Some items may be overflowing beyond their set size.', {
                        history: this._scrollPosHistory,
                        scrollPos,
                        clientSize,
                        scrollSize,
                        forceChange,
                        last: this.last,
                        range: {...this.range}
                    }
                )
                return true
            }
            this._scrollPosHistory.splice(0, shLen, scrollPos)
        }
        this._scrollPosHistory.push(scrollPos)

        return false
    }

    /**
     * calculating range on scroll
     * @param {TypeScrollPos} scrollPos
     * @param {TypeClientSize} clientSize
     * @param {TypeScrollSize} scrollSize
     * @param {boolean} [forceChange]
    */
    handleScroll(scrollPos, clientSize, scrollSize, forceChange = false) {
        if (this.detectScrollLoop(scrollPos, clientSize, scrollSize, forceChange)) {
            return
        }

        // @efficiency || scrollPos === 0  added
        this.direction = scrollPos < this.scrollPos || scrollPos === 0 ? DIRECTION_TYPE.FRONT : DIRECTION_TYPE.BEHIND
        this.scrollPos = scrollPos
        this.scrollPosRaw = scrollPos - this.getFrontSize()
        this.scrollSize = scrollSize

        const viewportChanged = this.clientSize !== clientSize || forceChange
        this.clientSize = clientSize

        if (!this.param) {
            this.logError('handleScroll()', logMsgs.paramIsNull)
            return
        }

        if (this.direction === DIRECTION_TYPE.FRONT) {
            this.handleFront(viewportChanged, 'handleScroll')
        } else if (this.direction === DIRECTION_TYPE.BEHIND) {
            this.handleBehind(viewportChanged, 'handleScroll')
        }

        this.debounceUpdateCalculations()
    }


    // ----------- public method end -----------

    /** #handleScroll, setPageModeOffset
     * @param {boolean} viewportChanged
     * @param {string} [_log] debug log
     * @returns
     */
    handleFront(viewportChanged = false, _log) {
        if (!this.param) return
        const overs = this.getScrollOvers()

        // @efficiency
        // should not change range if start doesn't exceed overs
        if (!viewportChanged && (
            // @modified
            //  if (overs > this.range.start) {
            overs > this.range.start || (overs === 0 && this.range.start === 0)
        )) {
            logEfficiency === 2 && console.warn("perf: handleFront should not change range if start doesn't exceed overs", {
                _log, overs, ...this.range, param: {...this.param}, size: this.getLength()

            })
            return
        }
        // logInfo && console.error('handleFront', overs, viewportChanged, _log, overs)

        // move up start by a buffer length, and make sure its safety
        const start = Math.max(overs - this.getBufferCalculated() * BUFFER_TESTRATIO, 0)
        this.checkRange(start, this.getEndByStart(start), viewportChanged)
    }

    /**
     * @param {boolean} viewportChanged
     * @param {string} [_log] debug log
     * @returns
     */
    handleBehind(viewportChanged = false, _log) {
        if (!this.param) return

        const overs = this.getScrollOvers()
        // @efficiency
        // range should not change if scroll overs within buffer
        // if (overs < this.range.start + this.getBufferCalculated() && !viewportChanged) {
        if (overs < this.range.start + this.getBufferCalculated() * BUFFER_TESTRATIO && !viewportChanged) {
            logEfficiency === 2 && console.warn('perf: handleBehind: range should not change if scroll overs within buffer')
            return
        }

        this.checkRange(overs, this.getEndByStart(overs), viewportChanged)
    }

    /** return the pass overs according to current scroll offset */
    getScrollOvers() {
        if (!this.param) return 0

        // if slot header exist, we need subtract its size
        const offset = this.scrollPos - this.getFrontSize()
        if (offset <= 0) {
            return 0
        }

        // if is fixed type, that can be easily
        if (this.isFixedType()) {
            return this.fixedSizeValue ? Math.floor(offset / this.fixedSizeValue) : 0
        }

        let low = 0
        let middle = 0
        let middleOffset = 0
        let high = this.getLength()

        while (low <= high) {
            // this.__bsearchCalls++
            middle = low + Math.floor((high - low) / 2)
            middleOffset = this.getIndexOffset(middle)

            if (middleOffset === offset) {
                return middle
            } else if (middleOffset < offset) {
                low = middle + 1
            } else if (middleOffset > offset) {
                high = middle - 1
            }
        }

        return low > 0 ? --low : 0
    }

    // can efficiency be improved more here?
    // although the call frequency is very high, its only a superposition of numbers
    /**
     * return a scroll position from given index
     * @param {number} givenIndex
     * @returns {number}
     */
    getIndexOffset(givenIndex) {
        if (!givenIndex || !this.param) {
            return 0
        }

        let offset = 0
        /** @type {number | undefined} */
        let indexSize = 0
        let index = 0

        const lastGivenIndex = this.lastIndexOffset.givenIndex
        // @efficiency
        // if last given index is smaller than current given index,
        // we can start from last given index for efficiency
        if (lastGivenIndex && lastGivenIndex < givenIndex) {
            index = lastGivenIndex
            offset = this.lastIndexOffset.offset
            logEfficiency === 2 && console.warn('pref: getIndexOffset', "start from last given index for efficiency", index)
        }

        for (; index < givenIndex; index++) {
            // this.__getIndexOffsetCalls++
            indexSize = this.getSizeByIndex(index)
            offset = offset + (typeof indexSize === "number" ? indexSize : this.getEstimateSize())
        }
        // remember last calculate index
        const calcIndex = Math.max(this.lastIndexOffset.calcIndex, givenIndex - 1)
        this.lastIndexOffset.calcIndex = Math.min(calcIndex, this.getLastIndex())
        this.lastIndexOffset.givenIndex = givenIndex
        this.lastIndexOffset.offset = offset
        return offset
    }

    /**
     * return item size based on the index of uniqueIds array
     * @param {number} index
     */
    getSizeByIndex(index) {
        if (!this.param) return 0
        return this.sizes.get(this.param.uniqueIds[index]) || this.getEstimateSize()
    }

    /** is fixed size type */
    isFixedType() {
        return this.calcType === CALC_TYPE.FIXED
    }

    /** return the real last index */
    getLastIndex() {
        return this.param ? this.param.uniqueIds.length - 1 : 0
    }

    /** get items (uniqueIds) length */
    getLength() {
        return this.param?.uniqueIds.length ?? 0
    }


    /**
     * in some conditions range is broke, we need correct it and then decide whether need update to next range
     * @param {number} start
     * @param {number} end
     * @param {boolean} force
     * @returns {boolean} whether need update to next range
    */
    checkRange(start, end, force = false) {
        if (!this.param) return false

        const keeps = this.getKeepsCalculated()
        const total = this.getLength()

        // data less than keeps, render all
        if (total <= keeps) {
            start = 0
            end = this.getLastIndex()
        } else if (end - start < keeps - 1) {
            // if range length is less than keeps, correct it base on end
            start = end - keeps + 1
        }

        if (start >= end) {
            this.logError("start should less than end", start, end)
        }
        if (this.range.start !== start || this.range.end !== end || force) {
            this.updateRange(start, end)
            return true
        }
        return false
    }

    /**
     * @param {number} start
     * @param {number} end
    */
    calcRangeSize(start, end, withNoBuffer = false) {
        let rangeSize = 0
        if (withNoBuffer) {
            start = Math.max(0, start + this.getBufferCalculated() * 0.5)
            end = Math.max(start + 1, Math.min(this.getLastIndex(), end - this.getBufferCalculated() * 0.5))
        }

        for (let index = start; index <= end; index++) {
            const size = this.getSizeByIndex(index)
            if (typeof size === "number") {
                rangeSize += size
            }
        }

        return rangeSize
    }


    /**
     * setting to a new range and rerender
     * @param {number} start
     * @param {number} end
     * @returns {boolean} whether range changed
    */
    updateRange(start, end) {

        this.range.start = start  // keep on top, getPadFront will uses this
        this.range.end = end // keep on top, getPadBehind will uses this
        this.range.padFront  = this.getPadFront()
        this.range.padBehind = this.getPadBehind()

        if (typeof this.callUpdate === "function") {
            this.callUpdate(this.getRange(), this.afterRenderCallback)
        }
        return true
    }

    getLargestItemSize() {
        const values = Array.from(this.sizes.values())
        return values.length ? Math.max.apply(null, values) : 0
    }


    getDesiredFillSize() {
        if (!this.param) return 1280
        const largestItemSize = this.getLargestItemSize()
        const extra = Math.max(
            this.getEstimateSize() * 2, largestItemSize * 2
        )
        const viewport = Math.max(
            this.clientSize + extra,
            this.clientSize * this.param.fillSizeMultiplier
        )
        const desiredFillSize = Math.min(viewport, this.param.fillMaxSize)
        return desiredFillSize
    }

    /**
     * check whether need render more or fewer items
     * @param {{
     *  range: TypeRange,
     *  rangeSize: number,
     *  desiredFillSize: number,
     * }} param0
     * @param {unknown} logData
     */

    rerenderNeeded({range, rangeSize, desiredFillSize}, logData) {
        if (!this.param) return false
        const noMoreItems = this.getLastIndex() <= range.end
        if (noMoreItems) {
            // no more items
            logEfficiency && console.warn('pref: checkRendered() escape: no more items')
        } else if (this.clientSize === 0) {
            logEfficiency && console.warn('pref: checkRendered() escape: clientSize === 0')
        } else if (rangeSize === 0) {
            logEfficiency && console.warn('pref: checkRendered() escape: rangeSize === 0')
        } else if (rangeSize < desiredFillSize) {
            return true
        } else {
            logInfo && console.log('range bigger than viewport', logData)
        }
        return false
    }

    /**
     * check whether need render more items to fill the viewport according to the current keepsBehaviour
    */
    checkRendered() {
        if (!this.param) return
        if (this.param.keepsBehaviour === KEEPS_BEHAVIOUR.AS_IS) {
            return
        }
        const range = { ...this.range }
        const param = { ...this.param }
        const desiredFillSize = this.getDesiredFillSize()
        const rangeSize = this.calcRangeSize(range.start, range.end, true)
        const lastChanged = this.getLastChanged(param, range, rangeSize)
        const logData = logInfo && {
            desiredFillSize, rangeSize, lastChanged, range, param,
            keepsCalculated: this.getKeepsCalculated()
        }

        // [...document.querySelectorAll('.virtual-scroll__item')].reduce((a, c) => a + c.clientHeight, 0);
        /**
         * @type {boolean} reset - true when the viewport has shrunk since the last render cycle
         */
        const reset = this.clientSize < this.last.clientSize && this.param.fillMaxSize > this.clientSize
        const keeps = reset ? this.getKeeps() : this.getKeepsCalculated()

        if (this.param.keepsBehaviour === KEEPS_BEHAVIOUR.AUTO_ADJUST) {

        }

        if (reset) {
            // this.setKeepsCalculated(keeps)
            // this.checkRange(start, this.getEndByStart(start), true)
            logInfo && console.info('info: checkRendered() - reset keeps', keeps)
            // return
        }


        if (lastChanged.length ===  0) {
            // @efficiency
            logEfficiency && console.warn('perf: checkRendered() lastChanged.length === 0', logData)
            return
        }

        this.setLastChanged(param, range, rangeSize)

        if (this.rerenderNeeded({range, rangeSize, desiredFillSize}, logData)) {
            if (this.isFixedType()) {
                this.fixedSizeValue
                // const diff = desiredFillSize - rangeSize
                // this.updateParam('keeps', this.getKeepsCalculated() + 1)
                // TODO: calc the exact keeps to fill the viewport by one render
            }
            this.setKeepsCalculated(this.getKeepsCalculated() + 1)
            this.checkRange(range.start, this.getEndByStart(range.start))

            logInfo && console.log("info: checkRendered() range smaller than viewport", logData)
        }
    }

    /**
     * @param {TypeParam} param
     * @param {TypeRange} range
     * @param {number} rangeSize
     * @returns {import('./lib').TypeObjChangedResult[]}
     */
    getLastChanged(param, range, rangeSize) {
        const lastParam = this.last.param || {...defaults, uniqueIds: []}
        return [
            ...getObjChangesByKeys(this.last.range, range,  this.eqRangeKeys, 'range.'),
            ...getObjChangesByKeys(this.last, this,  this.eqSelfKeys, 'this.'),
            ...getObjChangesByKeys(this.last, {rangeSize},  ['rangeSize']),
            ...getObjChangesByKeys(lastParam, param,  this.eqParamKeys, 'param.')
        ]
    }

    /**
     * @param {TypeParam} param
     * @param {TypeRange} range
     * @param {number} rangeSize
     */
    setLastChanged(param, range, rangeSize) {
        this.last.range = {...range}
        this.last.param = {...param}
        this.last.rangeSize = rangeSize
        for (const key of this.eqSelfKeys) {
            // @ts-ignore TODO: fix types
            this.last[key] = this[key]
        }
    }

    /**
     * return end base on start
     * @param {number} start
    */
    getEndByStart(start) {
        // ? + this.getBufferCalculated()
        const theoryEnd = start + this.getKeepsCalculated() - 1
        const truelyEnd = Math.min(theoryEnd, this.getLastIndex())
        // logInfo && console.log('getEndByStart', {start, theoryEnd, truelyEnd,
        //     'lastIndex': this.getLastIndex(),
        //     'keeps': this.getKeepsCalculated()
        // })
        return truelyEnd
    }

    /** return total front offset */
    getPadFront() {
        if (this.isFixedType()) {
            return this.fixedSizeValue * this.range.start
        } else {
            return this.getIndexOffset(this.range.start)
        }
    }

    /** return total behind offset */
    getPadBehind() {
        const end = this.range.end
        const lastIndex = this.getLastIndex()

        if (this.isFixedType()) {
            return (lastIndex - end) * this.fixedSizeValue
        }

        // if it's all calculated, return the exactly offset
        // TODO: refactor this: check all elements in the range are calculated or not
        // may be the average size changed since last render
        if (this.lastIndexOffset.calcIndex === lastIndex) {
            // logInfo && console.info('info: getPadBehind() lastIndexOffset.calcIndex === lastIndex')
            return this.getIndexOffset(lastIndex) - this.getIndexOffset(end)
        } else {
            // if not, use a estimated value
            // console.warn('Estimated return', this.lastIndexOffset.calcIndex,  lastIndex)
            return (lastIndex - end) * this.getEstimateSize()
        }
    }
    /**
     * @param {number} start scroll position by index
     * @returns {TypeScrollPos} return start index scroll position
     */
    getScrollPosByIndex(start) {
        return (start < 1 ? 0 : this.getIndexOffset(start)) + this.getFrontSize()
    }

    /**
     * @param {number} px scroll position in px
     * @returns {TypeScrollPos} return start index scroll position
     */
    getScrollPosByPx(px) {
        return px + this.getFrontSize()
    }

    /**
     * get the item estimate size
     * @returns {number}
     */
    getEstimateSize() {
        return this.isFixedType()
            ? this.fixedSizeValue
            : (this.averageSize || this.param?.estimateSize || 0)
    }


    scrollToIndex(index = 0) {
        this.param?.scrollTo(
            this.getScrollPosByIndex(
                Math.min(index, this.getLastIndex())
            )
        )
    }

    scrollToPx(px = 0) {
        const newPos = this.getScrollPosByPx(px)
        this.param?.scrollTo(newPos)
    }
    refreshScrollPos(force = false) {
        if (!force && this.scrollPosRaw <= 0) {
            // @efficiency
            logEfficiency && console.warn(
                'perf: refreshScrollPos() prevent scroll when scrollPosRaw <= 0', this.scrollPosRaw
            )
            return
        }
        this.scrollToPx(this.scrollPosRaw)
    }
}

Virtual.KEEPS_BEHAVIOUR = KEEPS_BEHAVIOUR

export default Virtual
