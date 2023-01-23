export const defaultNameSpace = 'virtual-scroll'

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
 * @param {(...args: unknown[]) => unknown} func
 * @param {number} rifFallbackDelay
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
 * virtual list core calculating center
 */

/** @type {Object<string, string>} */
const DIRECTION_TYPE = {
    FRONT: "FRONT", // scroll up or left
    BEHIND: "BEHIND" // scroll down or right
}
/** @type {Object<string, string>} */
const CALC_TYPE = {
    INIT: "INIT",
    FIXED: "FIXED",
    DYNAMIC: "DYNAMIC"
}
const LEADING_BUFFER = 2


/**
 * @typedef {Object} TypeRange
 * @property {number} start
 * @property {number} end
 * @property {number} padFront
 * @property {number} padBehind
 */




/**
 * @typedef {Object} TypeParamRequerd
 * @property {number} keeps
 * @property {number} estimateSize
 * @property {number} buffer
 * @property {Array<string | number>} uniqueIds
 */


/**
 * @typedef {Object} TypeParamOptional
 * @property {number} slotHeaderSize
 * @property {number} slotFooterSize
 * @property {number} pageModeOffset
 */

/**
 * @typedef {TypeParamRequerd & TypeParamOptional} TypeParam
 */

/**
 * @typedef {TypeParamRequerd | TypeParamOptional} TypeParamForInit
 */


export default class {
    /** @type {TypeParam | null} */
    param = null

    /**
     * @type {Function | null}
     * @param {TypeRange} range
    */
    callUpdate = null
    /** @type {number | null} */
    firstRangeTotalSize = 0

    firstRangeAverageSize = 0
    /** @type {Map<number | string, number>} */
    sizes = new Map()
    lastCalcIndex = 0
    fixedSizeValue = 0
    /** @type {keyof typeof CALC_TYPE} */
    calcType = CALC_TYPE.INIT
    offset = 0
    /** @type {keyof typeof DIRECTION_TYPE | ""} */
    direction = ""
    /** @type {TypeRange} */
    range = Object.create(null)

    /**
     * @param {TypeParamForInit} param
     * @param {(range: TypeRange) => void} callUpdate
     */
    constructor(param, callUpdate) {
        this.init(param, callUpdate)
    }

    /**
     * @param {TypeParamForInit | null} param
     * @param {Function | null} callUpdate
     * @param {keyof typeof CALC_TYPE} [_calcType]
     */
    init(param, callUpdate, _calcType) {
        // param data
        /** @type {TypeParam | null} */
        this.param = param ? Object.assign({
            slotHeaderSize: 0,
            slotFooterSize: 0,
            pageModeOffset: 0,
            keeps: 30,
            estimateSize: 50,
            buffer: 10,
            uniqueIds: []
        }, param) : null
        this.callUpdate = callUpdate

        // size data
        this.sizes = new Map()
        this.firstRangeTotalSize = 0
        this.firstRangeAverageSize = 0
        this.lastCalcIndex = 0
        this.fixedSizeValue = 0
        this.calcType = _calcType || CALC_TYPE.INIT

        // scroll data
        this.offset = 0
        this.direction = ""

        // range data
        this.range = Object.create(null)
        if (param) {
            this.checkRange(0, this.getKeeps() - 1)
        }

        // benchmark example data
        // this.__bsearchCalls = 0
        // this.__getIndexOffsetCalls = 0
    }

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

    getSlotHeaderSize() {
        if (typeof this.param?.pageModeOffset === "number" && this.param.pageModeOffset > 0) {
            return this.param.pageModeOffset + this.param?.slotHeaderSize ?? 0
        }
        return this.param?.slotHeaderSize ?? 0
    }

    /**
     * @param {number} start
     * @returns {number} return start index offset
     */
    getOffset(start) {
        return (start < 1 ? 0 : this.getIndexOffset(start)) + this.getSlotHeaderSize()
    }

    /**
     * @param {keyof TypeParam} key
     * @param {unknown} value
    */
    updateParam(key, value) {
        if (!this.param) {
            this.consoleError('updateParam() param is not yet initialized')
            return
        }

        switch (key) {
            case "uniqueIds": {
                // if uniqueIds change, find out deleted id and remove from size map
                this.sizes.forEach((v, key) => {
                    if (Array.isArray(value) && !value.includes(key)) {
                        this.sizes.delete(key)
                    }
                })
                if (Array.isArray(value)) {
                    this.param[key] = value
                } else {
                    this.consoleError('invalid param value', key, value)
                }
                break
            }
            case "keeps":
            case "estimateSize":
            case "buffer":
            case "slotHeaderSize":
            case "slotFooterSize":
            case "pageModeOffset": {
                if (typeof value !== "number" || !isFinite(value))  {
                    this.consoleError('invalid param value', key, value)
                    break
                }
                if (key === "pageModeOffset") {
                    this.param[key] = value
                    this.handleFront()
                    this.handleBehind()
                } else {
                    this.param[key] = Math.max(value, 0)
                }
                break
            }
            default: {
                this.consoleError('unexpected param key', key, value)
                break
            }
        }
    }

    getKeeps() {
        return Math.max(this.param?.keeps ?? 30, 3)
    }

    // save each size map by id
    /**
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
        this.firstRangeTotalSize = 0
    }

    calcAverageSizeOnce() {
        if (!this.param) return

        // calculate the average size only in the first range
        if (this.calcType !== CALC_TYPE.FIXED && this.firstRangeTotalSize !== null) {
            if (this.sizes.size < Math.min(this.getKeeps(), this.param.uniqueIds.length)) {
                this.firstRangeTotalSize = [...this.sizes.values()].reduce((acc, val) => acc + val, 0)
                this.firstRangeAverageSize = Math.round(this.firstRangeTotalSize / this.sizes.size) || 0
            } else {
                // it's done using
                this.firstRangeTotalSize = null
            }
        }
    }

    // in some special situation (e.g. length change) we need to update in a row
    // try going to render next range by a leading buffer according to current direction
    handleDataSourcesChange() {
        let start = this.range.start

        if (this.isFront()) {
            start = start - LEADING_BUFFER
        } else if (this.isBehind()) {
            start = start + LEADING_BUFFER
        }

        start = Math.max(start, 0)

        this.updateRange(this.range.start, this.getEndByStart(start))
    }

    // when slot size change, we also need force update
    handleSlotSizeChange() {
        this.handleDataSourcesChange()
    }

    // calculating range on scroll
    /** @param {number} offset */

    handleScroll(offset) {
        this.direction = offset < this.offset ? DIRECTION_TYPE.FRONT : DIRECTION_TYPE.BEHIND
        this.offset = offset
        if (!this.param) {
            this.consoleError('handleScroll: No param, return')
            return
        }

        if (this.direction === DIRECTION_TYPE.FRONT) {
            this.handleFront()
        } else if (this.direction === DIRECTION_TYPE.BEHIND) {
            this.handleBehind()
        }
    }

    // ----------- public method end -----------

    handleFront() {
        if (!this.param) return
        const overs = this.getScrollOvers()
        // should not change range if start doesn't exceed overs
        if (overs > this.range.start) {
            return
        }

        // move up start by a buffer length, and make sure its safety
        const start = Math.max(overs - this.param.buffer, 0)
        this.checkRange(start, this.getEndByStart(start))
    }

    handleBehind() {
        if (!this.param) return

        const overs = this.getScrollOvers()
        // console.log(overs < this.range.start + this.param.buffer, {
        //     overs, "start": this.range.start, "buffer": this.param.buffer
        // })

        // range should not change if scroll overs within buffer
        if (overs < this.range.start + this.param.buffer) {
            return
        }

        this.checkRange(overs, this.getEndByStart(overs))
    }

    // return the pass overs according to current scroll offset
    getScrollOvers() {
        if (!this.param) return 0

        // if slot header exist, we need subtract its size
        const offset = this.offset - this.getSlotHeaderSize()
        if (offset <= 0) {
            return 0
        }

        // if is fixed type, that can be easily
        if (this.isFixedType()) {
            return  this.fixedSizeValue ? Math.floor(offset / this.fixedSizeValue) : 0
        }

        let low = 0
        let middle = 0
        let middleOffset = 0
        let high = this.param.uniqueIds.length

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

    // return a scroll offset from given index, can efficiency be improved more here?
    // although the call frequency is very high, its only a superposition of numbers
    /**
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
        for (let index = 0; index < givenIndex; index++) {
            // this.__getIndexOffsetCalls++
            indexSize = this.sizes.get(this.param.uniqueIds[index])
            offset = offset + (typeof indexSize === "number" ? indexSize : this.getEstimateSize())
        }

        // remember last calculate index
        this.lastCalcIndex = Math.max(this.lastCalcIndex, givenIndex - 1)
        this.lastCalcIndex = Math.min(this.lastCalcIndex, this.getLastIndex())

        return offset
    }

    // is fixed size type
    isFixedType() {
        return this.calcType === CALC_TYPE.FIXED
    }

    // return the real last index

    getLastIndex() {
        return this.param ? this.param.uniqueIds.length - 1 : 0
    }

    // in some conditions range is broke, we need correct it
    // and then decide whether need update to next range
    /**
     * @param {number} start
     * @param {number} end
    */
    checkRange(start, end) {
        if (!this.param) return
        const keeps = this.getKeeps()
        const total = this.param.uniqueIds.length

        // data less than keeps, render all
        if (total <= keeps) {
            start = 0
            end = this.getLastIndex()
        } else if (end - start < keeps - 1) {
            // if range length is less than keeps, correct it base on end
            start = end - keeps + 1
        }

        if (this.range.start !== start) {
            this.updateRange(start, end)
        }
    }

    // setting to a new range and rerender
    /**
     * @param {number} start
     * @param {number} end
    */
    updateRange(start, end) {
        this.range.start = start
        this.range.end = end
        this.range.padFront = this.getPadFront()
        this.range.padBehind = this.getPadBehind()
        if (typeof this.callUpdate === "function") {
            this.callUpdate(this.getRange())
        }
    }

    // return end base on start
    /**
     * @param {number} start
    */
    getEndByStart(start) {
        const theoryEnd = start + (this.getKeeps() || 1) - 1
        const truelyEnd = Math.min(theoryEnd, this.getLastIndex())
        return truelyEnd
    }

    // return total front offset
    getPadFront() {
        if (this.isFixedType()) {
            return this.fixedSizeValue * this.range.start
        } else {
            return this.getIndexOffset(this.range.start)
        }
    }

    // return total behind offset
    getPadBehind() {
        const end = this.range.end
        const lastIndex = this.getLastIndex()

        if (this.isFixedType()) {
            return (lastIndex - end) * this.fixedSizeValue
        }

        // if it's all calculated, return the exactly offset
        if (this.lastCalcIndex === lastIndex) {
            return this.getIndexOffset(lastIndex) - this.getIndexOffset(end)
        } else {
            // if not, use a estimated value
            return (lastIndex - end) * this.getEstimateSize()
        }
    }

    // get the item estimate size
    /** @returns {number} */
    getEstimateSize() {
        return this.isFixedType()
            ? this.fixedSizeValue
            : (this.firstRangeAverageSize || this.param?.estimateSize || 0)
    }

    /**
     * @param {unknown[]} args
     */
    consoleError(...args) {
        console.error(defaultNameSpace, ...args)
    }
}
