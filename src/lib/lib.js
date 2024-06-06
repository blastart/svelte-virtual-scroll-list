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
 * @typedef {{key: string, from: any, to: any}} TypeObjChangedResult
 */
/**
 * getObjChangesByKeys
 * @param {Object.<string, any>} aObj - "from" object to compare
 * @param {Object.<string, any>} bObj - "to" object to compare
 * @param {string[]} keys - object keys to compare
 * @param {string} [keyPrefix] - prefix to be added to the keys in the result.
 * @returns {TypeObjChangedResult[]}
*/
export const getObjChangesByKeys = (aObj, bObj, keys = [], keyPrefix = '') => {
    /** @type {TypeObjChangedResult[]} */
    const changedKeys = []

    return keys.reduce((acc, key) => {
        if (aObj[key] !== bObj[key]) {
            acc.push({ key: keyPrefix + key, from: aObj[key], to: bObj[key] })
        }
        return acc
    }, changedKeys)
}



/** @param {Object.<string, any>} obj */
export const margeDefinedProps = obj => Object.fromEntries(
    // eslint-disable-next-line no-unused-vars
    Object.entries(obj).filter(([_k, v]) => v !== undefined)
)


/**
 * chunnk array like lodash.chunk
 * @param {unknown[]} arr
 * @param {number} size
 * @returns {[...unknown][]}
 *
*/
export const arrayChunk = (arr = [], size = 2) => {
    const chunked_arr = []
    let index = 0
    while (index < arr.length) {
        chunked_arr.push(arr.slice(index, Math.min(index + size, arr.length)))
        index += size
    }
    return chunked_arr

}


/**
 * @param {(...args: unknown[]) => unknown} func - function to wrap in debounce
 * @param {number} wait - debounce delay in ms
 * @returns {(...args: unknown[]) => unknown} returns a function that wraps the original fn in debounce
 */
export const debounceFn = function(func, wait = 100) {
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
* Creates ranges from a sequence of numbers.
* @param {(number | string)[]} values - The array of numbers or numeric strings to create ranges from.
* @returns {(number | [number, number])[]} - An array of either numbers or ranges represented as tuples.
*/
export const createRangesFromValues = (values = []) => {
    /** @type {(number | [number, number])[]} */
    const ranges = []
    let start = -1
    let end = -1

    for (const element of values) {
        const val = Number(element)
        if (isNaN(val)) {
            console.warn('createRanges: value is not a number', element, 'skipping')
            continue
        }
        if (start === -1) {
            start = val
            end = val
        } else if (val === end + 1) {
            end = val
        } else {
            if (start === end) {
                ranges.push(start)
            } else {
                ranges.push([start, end])
            }
            start = val
            end = val
        }
    }
    if (start !== -1) {
        if (start === end) {
            ranges.push(start)
        } else {
            ranges.push([start, end])
        }
    }
    return ranges;
};


/**
* Creates ranges from a sequence of numbers.
* @param {(number | string)[]} values - The array of numbers or numeric strings to create ranges from.
* @param {string} [valueSeparator] - The separator to use when joining the ranges.
* @returns {string} - A string representation of the ranges. e.g. '1-3, 5, 7-9, 11'
*/
export const createRangeStringFromValues = (values = [], valueSeparator = ',') => {
    const ranges = createRangesFromValues(values)
    return ranges.map(range => {
        if (Array.isArray(range)) {
            return `${range[0]}-${range[1]}`
        }
        return range + ''
    }).join(valueSeparator)
}


/**
* Creates ranges from a sequence of numbers.
* @param {(number | [number, number])[]} ranges - An array of either numbers or ranges represented as tuples.
* @returns {number[]} - The array of numbers created from the ranges.
*/
export const createValuesFromRanges = (ranges = []) => {
    /** @type {number[]} */
    const values = []
    for (const range of ranges) {
        if (Array.isArray(range)) {
            const [start, end] = range
            for (let i = start; i <= end; i++) {
                values.push(i)
            }
        } else {
            values.push(range)
        }
    }
    return values
}

/**
 * Creates values from a range string using
 * @param {string} rangeStr - The string representation of the ranges. e.g. '1-3, 5, 7-9, 11'
 * @param {string} [valueSeparator] - The separator to use when splitting the ranges.
 * @returns {number[]} - The array of numbers created from the ranges.
 */
export const createValuesFromRangeString = (rangeStr = '', valueSeparator = ',') => {
    const ranges = rangeStr.split(valueSeparator).map(r => r.trim()).filter(r => r.length > 0)
    const values = []
    for (const range of ranges) {
        const parts = range.split('-').map(p => p.trim()).filter(p => p.length > 0)
        if (parts.length === 1) {
            values.push(Number(parts[0]))
        } else if (parts.length === 2) {
            const start = Number(parts[0])
            const end = Number(parts[1])
            if (isNaN(start) || isNaN(end)) {
                console.warn('createValuesFromRangeString: start or end is not a number', range, 'skipping')
                continue
            }
            for (let i = start; i <= end; i++) {
                values.push(i)
            }
        } else {
            console.warn('createValuesFromRangeString: invalid range', range, 'skipping')
        }
    }
    return values

}


export const testRangesFns = () => {
    const testArray = [0, 1, 2, 3, 12, 42, 43, 44, 56, 98, 34, 35, 2]
    const rangesRes = createRangesFromValues(testArray)
    console.log('testRangesFns.rangesRes', rangesRes)
    const valuesRes = createValuesFromRanges(rangesRes)
    console.log('testRangesFns.valuesRes', valuesRes)
    console.log('testRangesFns.diff', JSON.stringify(testArray) === JSON.stringify(valuesRes) ? 'PASSED' : 'FAILED')

    const rangeStr = createRangeStringFromValues(testArray)
    console.log('testRangesFns.rangeStr', rangeStr)
    const valuesFromRangeStr = createValuesFromRangeString(rangeStr)
    console.log('testRangesFns.valuesFromRangeStr', valuesFromRangeStr)
    console.log('testRangesFns.diff', JSON.stringify(testArray) === JSON.stringify(valuesFromRangeStr) ? 'PASSED' : 'FAILED')
}
