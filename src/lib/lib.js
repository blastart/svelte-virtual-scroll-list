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
