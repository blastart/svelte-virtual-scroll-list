export const defaultNameSpace = 'virtual-scroll'

export const browser = typeof window !== "undefined"

/**
 * @type {0 | 1 | 2}
 * 0 - no log
 * 1 - log  major efficient improvements
 * 2 - log  major & minor improvements
*/
const logEfficiency = 1

/**
 * @typedef {false | 0 | "" | null | undefined | void} TypeFalsy
 */

/**
 * @param {Array<string | TypeFalsy>} classList
 * @returns {string}
 * @example
 * joinClassNames('a', false, 'b', 'c', null) // 'a b c'
 */
export const joinClassNames = (...classList) => classList
    .filter((c) => typeof c === 'string' && c.trim().length > 0)
    .map((c) => c && c.trim())
    .join(' ')

/**
 * getObjChangesByKeys
 * @param {Object.<string, any>} aObj - "from" object to compare
 * @param {Object.<string, any>} bObj - "to" object to compare
 * @param {string[]} keys - object keys to compare
 * @param {string} [keyPrefix] - prefix to be added to the keys in the result.
 * @returns {{key: string, from: any, to: any}[]}
*/
const getObjChangesByKeys = (aObj, bObj, keys = [], keyPrefix = '') => {
    /** @type {{key: string, from: any, to: any}[]} */
    const changedKeys = []

    return keys.reduce((acc, key) => {
        if (aObj[key] !== bObj[key]) {
            acc.push({ key: keyPrefix + key, from: aObj[key], to: bObj[key] })
        }
        return acc
    }, changedKeys)
}


/**
 * @param {(...args: unknown[]) => unknown} func - function to wrap in requestIdleCallback
 * @param {number} rifFallbackDelay - fallback delay in ms
 * @returns {(...args: unknown[]) => unknown} returns a function that wraps the original fn in requestIdleCallback
 */
export function rifFn(func, rifFallbackDelay = 40) {
    /** @type { ReturnType<typeof requestIdleCallback> | null } */
    let idleTimeout
    /** @type { ReturnType<typeof setTimeout> | null } */
    let fallbackTimeout

    let fallbackLastCall = 0

    const rifSupport = typeof requestIdleCallback === 'function'

    /**
    * @param {...*} args
    * @this {unknown}
    */
    return function(...args) {
        const timerFn = () => {
            func.apply(this, args)
            idleTimeout = fallbackTimeout = null
            if (!rifSupport) fallbackLastCall = Date.now()
        }

        if (rifSupport) {
            idleTimeout && cancelIdleCallback(idleTimeout)
            idleTimeout = requestIdleCallback(timerFn)
        } else { // safari does not support requestIdleCallback yet
            const now = Date.now()
            fallbackTimeout && clearTimeout(fallbackTimeout)

            if (now - fallbackLastCall > rifFallbackDelay) {
                timerFn()
            }

            fallbackTimeout = setTimeout(timerFn, rifFallbackDelay)
        }
    }
}

/**
 * @param {(...args: unknown[]) => unknown} func - function to wrap in debounce
 * @param {number} wait - debounce delay in ms
 * @returns {(...args: unknown[]) => unknown} returns a function that wraps the original fn in debounce
 */
const debounceFn = function(func, wait = 100) {
    /** @type { ReturnType<typeof setTimeout> | null } */
    let timeout = null
    /**
    * @param {...*} args
    * @this {unknown}
    */
    return function(...args) {
        timeout && clearTimeout(timeout)
        timeout = setTimeout(() => {
            timeout = null
            func.apply(this, args)
        }, wait)
    }
}

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
 * @property {string} FIXED - the elements already rendered included only elements of the same size.
 * @property {string} DYNAMIC - the elements already rendered included elements of different sizes.
*/
const CALC_TYPE = {
    INIT: "INIT",
    FIXED: "FIXED",
    DYNAMIC: "DYNAMIC"
}


const LEADING_BUFFER = 1
/** minimum number of items to render */
const MIN_KEEPS = 2

/**
 * behaviour options to calculate the number of items to render
 * @readonly
 * @enum {string}
 * @property {string} AS_IS - uses the value set in params.
 * @property {string} AUTO_INCREASE - increments the value set in param.keeps until the rendered
 *                                    range becomes larger than the viewport.
 * @property {string} AUTO_ADJUST - Increments/decrements the value set in params according
 *                                  to the size of the viewport.
 * @property {string} ACCURATE - Renders an exact number of items to fill the viewport in each
*/
export const KEEPS_BEHAVIOUR = {
    AS_IS: "as-is",
    AUTO_INCREASE: "auto-increase",
    AUTO_ADJUST: "auto-adjust",
    ACCURATE: "accurate"
}

/**
 * contains the calculated range of the items to render
 * @typedef {Object} TypeRange
 * @property {number} start
 * @property {number} end
 * @property {number} padFront
 * @property {number} padBehind
 */

/**
 * @typedef {string | number} TypeUniqueId
 */


/**
 * @typedef {Object} TypeParamRequired
 * @property {TypeUniqueId[]} uniqueIds
 * @property {(position: TypeScrollPos) => void} scrollTo Scroll to position call to be applied on the current scollable container.
*/


/**
 * @typedef {Object} TypeParamOptional
 * @property {number} buffer items to render in addition to the keeps. recommend for a third of keeps
 * @property {number} keeps how many items to keep in the DOM
 * @property {number} estimateSize estimate size of the item
 * @property {KEEPS_BEHAVIOUR} keepsBehaviour behaviour of the keeps calculation
 * @property {number} fillMaxSize Maximum fill height, prevents infinite cycles if the parent element has no height set
 * @property {number} fillSizeExtra extra size by px to fill the viewport with items. This value is added to viewport size
 * @property {number} slotHeaderSize size of the header slot
 * @property {number} slotFooterSize size of the footer slot
 * @property {number} pageModeOffset in vertical mode, offset left, otherwise offset top of the root element (eg: root.getBoundingClientRect().top + window.pageYOffset)
 * @property {boolean} updateAverageSize update the average size of items after each scroll
 */

/**
 * @typedef {TypeParamRequired & TypeParamOptional} TypeParam
 */

/**
 * @typedef {TypeParamRequired | TypeParamOptional} TypeParamForInit
 */

/**
 * @typedef {number} TypeScrollPos scroll position of the root or document element depending on view modes
*/

/**
 * @typedef {number} TypeClientSize
 * @description client size of the root or document element depending on view modes
*/

/**
 * @typedef {number} TypeScrollSize scroll size of the root or document element depending on view modes

/**
 * @typedef {(clientSize: TypeClientSize) => void} TypeAfterRenderFn
 */

/**
 * @typedef {(this: Virtual, rng: TypeRange, afterRender: TypeAfterRenderFn) => void | null} TypeCallUpdateFn
 */

const logMsgs = {
    paramIsNull: 'param is not yet initialized',
    paramInvalidVal: 'invalid param value',
    paramInvalidKey: 'invalid param key'
}

const defaults = {
    keeps: 30,
    keepsBehaviour: KEEPS_BEHAVIOUR.AUTO_ADJUST,
    slotHeaderSize: 0,
    slotFooterSize: 0,
    pageModeOffset: 0,
    fillSizeExtra: 100,
    fillMaxSize: 10000,
    updateAverageSize: true,
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

    /** buffer value based on the keepsBehaviour */
    bufferCalculated = 0

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
     * scrollPos:TypeScrollPos,
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
        scrollPos: 0,
        rangeSize: 0
    }
    /** this.range[key] is compared to this.last.range[key] */
    eqRangeKeys = ["start", "end", "padFront", "padBehind"]
    /**  this.param[key] is compared to this.last.param[key] */
    eqParamKeys = ["uniqueIds", ...Object.keys(defaults)]
    /** this[key] is compared to this.last[key] */
    eqSelfKeys = ["clientSize", "scrollSize", "scrollPos", "dataChanges"]


    /**
     * @param {TypeParamForInit} param
     * @param {TypeCallUpdateFn} callUpdate
     * @param {boolean} logErros log errors to console
     */
    constructor(param, callUpdate, logErros = true) {

        /** @type {(...args: unknown[]) => unknown}  */
        this.logError = logErros && browser && console?.error
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
        }, (param || {}))
        this.callUpdate = callUpdate
        this.bufferCalculated = this.param?.buffer || 10
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
    //     this.calcAverageSize() // recalculate average size when scrolling to front
    // })

    debounceUpdateCalculations = debounceFn(/** @type {(this: Virtual) => void} */ function() {
        if (this.param?.updateAverageSize) {
            this.calcAverageSize() // recalculate average size when scrolling to front
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
     * @param {TypeUniqueId[]} uniqueIds
     */
    setUniqueIds(uniqueIds) {
        if (!this.param) {
            this.logError('setUniqueIds()', logMsgs.paramIsNull)
            return
        }

        // if uniqueIds change, find out deleted id and remove from size map
        this.sizes.forEach((v, key) => {
            if (Array.isArray(uniqueIds) && !uniqueIds.includes(key)) {
                this.sizes.delete(key)
            }
        })
        if (Array.isArray(uniqueIds)) {
            this.param.uniqueIds = uniqueIds
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
        this.param.pageModeOffset = Math.round(value)
        this.handleFront(false, 'setPageModeOffset ' + _log)
        this.handleBehind(false, 'setPageModeOffset ' + _log)
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

        switch (key) {
            case "uniqueIds": {
                if (Array.isArray(value)) this.setUniqueIds(value)
                break
            }
            case "keepsBehaviour": {
                const validValues = Object.values(KEEPS_BEHAVIOUR)
                if (typeof value === "string" && validValues.includes(value)) {
                    this.param[key] = value
                } else {
                    this.logError('updateParam()', logMsgs.paramInvalidVal, key, value,
                        'should use one of these:', validValues.join(', ')
                    )
                }
                break
            }
            case "updateAverageSize": {
                if (typeof value === "boolean") {
                    this.param[key] = value
                } else {
                    this.logError('updateParam()', logMsgs.paramInvalidVal, key, value,
                        'use boolean instead'
                    )
                }
                break
            }
            case "pageModeOffset":
            case "keeps":
            case "estimateSize":
            case "buffer":
            case "fillSizeExtra":
            case "fillMaxSize":
            case "slotHeaderSize":
            case "slotFooterSize":{
                if (typeof value !== "number" || !isFinite(value))  {
                    this.logError('updateParam()', logMsgs.paramInvalidVal, key, value,
                        'use number instead'
                    )
                    break
                }
                if (key === "pageModeOffset") {
                    this.setPageModeOffset(value, 'updateParam')
                } else {
                    this.param[key] = Math.max(value, 0)
                }
                break
            }
            default: {
                this.logError('updateParam', logMsgs.paramInvalidKey, key)
                break
            }
        }
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

    /**
     * @returns {number} param.keeps value
     */
    getKeeps() {
        return Math.max(this.param?.keeps ?? defaults.keeps, MIN_KEEPS)
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
        this.keepsCalculated = value | 1
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

    clearSizes() {
        this.sizes.clear()
        this.firstRangeAvgCalculated = false
        this.fixedSizeValue = 0
        this.calcType = CALC_TYPE.INIT
    }

    /**
     * calculates the average size of all items that have been rendered.
     * @param {boolean} force force to calculate average size even if the range is not full
     */

    calcAverageSize(force = false) {
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
            if (oldAverageSize !== this.averageSize) {
                if (!force) {
                    console.warn('averageSize changed', oldAverageSize - this.averageSize)
                    // this.param?.scrollTo(this.getScrollPosByIndex(this.range.start))
                }
            }
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
            // console.log('calcAverageSizeOnce')
            if (this.sizes.size < Math.min(this.getKeepsCalculated(), this.getLength())) {
                this.calcAverageSize(true)
                // console.log('calcAverageSizeOnce DONE', this.averageSize)
            } else {
                this.firstRangeAvgCalculated = true
            }
        }
    }


    /**
     * in some special situation (e.g. length change) we need to update in a row
     * try going to render next range by a leading buffer according to current direction
    */
    handleDataSourcesChange() {
        let start = this.range.start

        if (this.isFront()) {
            // start = start - LEADING_BUFFER
            start = start - this.getBufferCalculated()
        } else if (this.isBehind()) {
            // start = start + LEADING_BUFFER
            start = start + this.getBufferCalculated()
        }

        // start = Math.max(start, 0)
        start = Math.min(Math.max(start, 0), this.getLastIndex())

        console.log("handleDataSourcesChange", start, this.isFront())

        this.dataChanges += 1

        this.updateRange(this.range.start, this.getEndByStart(start))
    }

    /**
     * calculating range on scroll
     * @param {TypeScrollPos} scrollPos
     * @param {TypeClientSize} clientSize
     * @param {TypeScrollSize} scrollSize
     * @param {boolean} [forceChange]
    */
    handleScroll(scrollPos, clientSize, scrollSize, forceChange = false) {
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

    /**
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
            overs > this.range.start || (overs === 0 && this.range.start === 0)
        )) {
            logEfficiency && console.warn("perf: handleFront should not change range if start doesn't exceed overs")
            return
        }
        // console.error('handleFront', overs, viewportChanged, _log, overs)

        // move up start by a buffer length, and make sure its safety
        const start = Math.max(overs - this.getBufferCalculated(), 0)
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
        if (overs < this.range.start + this.getBufferCalculated() && !viewportChanged) {
            logEfficiency && console.warn('perf: handleBehind: range should not change if scroll overs within buffer')
            return
        }
        // console.error('handleBehind', overs, viewportChanged, _log)

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
        return this.sizes.get(this.param.uniqueIds[index])
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
     * @param {boolean} viewportChanged
     * @returns {boolean} whether need update to next range
    */
    checkRange(start, end, viewportChanged = false) {
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

        // if (this.range.start !== start) {
        //     this.updateRange(start, end)
        // }
        if (this.range.start !== start || this.range.end !== end || viewportChanged) {
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
            start = Math.max(0, start + this.getBufferCalculated())
            end = Math.max(start + 1, Math.min(this.getLastIndex(), end - this.getBufferCalculated()))
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

    /**
     * check whether need render more items to fill the viewport according to the current keepsBehaviour
    */
    checkRendered() {
        if (!this.param) return
        if (this.param.keepsBehaviour === KEEPS_BEHAVIOUR.AS_IS) {
            return
        }
        const log = false

        const range = { ...this.range }
        const param = { ...this.param }
        /**
         * @type {boolean} reset - true when the viewport has shrunk since the last render cycle
         */
        const reset = this.clientSize < this.last.clientSize && this.param.fillMaxSize > this.clientSize
        const values = Array.from(this.sizes.values())
        const largestItemSize = values.length ? Math.max.apply(null, values) : 0

        const keeps = reset ? this.getKeeps() : this.getKeepsCalculated()

        if (reset) {
            // this.setKeepsCalculated(keeps)
            // this.checkRange(start, this.getEndByStart(start), true)
            console.warn('reset keeps', keeps)
            return
        }
        const buffer = this.getBufferCalculated()
        const extra = Math.max(this.getEstimateSize(), this.param.fillSizeExtra, largestItemSize) + 1
        const desiredFillSize = Math.min(this.clientSize + extra, this.param.fillMaxSize)
        const displayedItems = range.end - range.start + 1
        const noMoreItems = this.getLastIndex() <= range.end
        const rangeSize = this.calcRangeSize(range.start, range.end, true)
        const dataChanged = this.last.dataChanges !== this.dataChanges

        const lastChanged = this.getLastChanged(param, range, rangeSize)


        console.log('checkRendered', {
            lastChanged,
            'this.getEstimateSize()': this.getEstimateSize(),
            buffer,
            reset,
            clientSize: this.clientSize,
            extra,
            last: this.last,
            largestItemSize,
            displayedItems,
            noMoreItems,
            rangeSize,
            dataChanged,
            desiredFillSize,
            keeps,
            range,
            param,
            'getFrontSize': this.getFrontSize()
        })

        if (lastChanged.length ===  0) {
            // @efficiency
            logEfficiency && console.warn('perf: [disabled] rangeSize === this.last.rangeSize', rangeSize, this.last.rangeSize)
            // not very well, if the data is changed, the rangeSize will not change, but the items will be changed
            return
        }

        this.setLastChanged(param, range, rangeSize)

        if (noMoreItems) {
            // no more items
            logEfficiency && console.warn('pref: no more items')
        } else if (this.clientSize === 0) {
            logEfficiency && console.warn('pref: clientSize === 0')
        } else if (
            rangeSize && rangeSize < desiredFillSize
        ) {
            if (this.isFixedType()) {
                this.fixedSizeValue
                // const diff = desiredFillSize - rangeSize
                console.log('FIXED SIZE')
                // this.updateParam('keeps', this.getKeepsCalculated() + 1)
                // TODO: calc the exact keeps to fill the viewport by one render
            }
            this.setKeepsCalculated(this.getKeepsCalculated() + 1)


            console.log("range smaller than viewport", {
                'this.clientSize': this.clientSize,
                rangeSize,
                keeps,
                range,
                param
            })

            this.checkRange(range.start, this.getEndByStart(range.start))
        } else {
            log && console.log('range bigger than viewport', this.getKeepsCalculated())
        }
    }

    /**
     * @param {TypeParam} param
     * @param {TypeRange} range
     * @param {number} rangeSize
     */
    getLastChanged(param, range, rangeSize) {
        const prevParam = this.last.param || {...defaults, uniqueIds: []}
        return [
            ...getObjChangesByKeys(this.last.range, range,  this.eqRangeKeys, 'range.'),
            ...getObjChangesByKeys(this.last, this,  this.eqSelfKeys, 'this.'),
            ...getObjChangesByKeys(this.last, {rangeSize},  ['rangeSize']),
            ...getObjChangesByKeys(prevParam, param,  this.eqParamKeys, 'param.')
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
    }

    /**
     * return end base on start
     * @param {number} start
    */
    getEndByStart(start) {
        // ? + this.getBufferCalculated()
        const theoryEnd = start + this.getKeepsCalculated() - 1
        const truelyEnd = Math.min(theoryEnd, this.getLastIndex())
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
        if (this.lastIndexOffset.calcIndex === lastIndex) {
            return this.getIndexOffset(lastIndex) - this.getIndexOffset(end)
        } else {
            // if not, use a estimated value
            // console.warn('Estimated return', this.lastIndexOffset.calcIndex,  lastIndex)
            return (lastIndex - end) * this.getEstimateSize()
        }
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
    refreshScrollPos() {
        this.scrollToPx(this.scrollPosRaw)
    }
}

Virtual.KEEPS_BEHAVIOUR = KEEPS_BEHAVIOUR

export default Virtual
