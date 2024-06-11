import { browser } from "$app/environment"

/** @param {string} name */
export const getParam = name => {
    if (!browser) return ""
    const url = new URL(window.location.href)
    return decodeURIComponent(url.searchParams.get(name) || "")
}

/**
 * @param {string} name URL.searchParams name
 * @param {string} value URL.searchParams value
 */
export const setParam = (name, value) => {
    if (!browser) return
    const paramValue = encodeURIComponent(value)
    const url = new URL(window.location.href)
    url.searchParams.set(name, paramValue)
    window.history.pushState({}, "", url)
}

export const isNumInRange = (num = 0, min = -Infinity, max = +Infinity) => {
    if (typeof num === 'number' && isFinite(num) && !isNaN(num)) {
        return num >= min && num <= max
    }
}

/**
 * @param {string} str
 * @returns {any} 
*/
export const parseJSON = (str = '') => {
    try {
        return JSON.parse(str)
    // eslint-disable-next-line no-unused-vars
    } catch (_err) { return null }
}



/** Dispatch event on click outside of node */
/** @param {HTMLElement & CustomEventInit<any>} node */
export function useClickOutside(node) {
    if (!browser) return
    /**
     * @param {MouseEvent} event
     */
    const handleClick = event => {
        if (
            node && event.target &&
            // @ts-ignore
            !node.contains(event.target) &&
            !event.defaultPrevented
        ) {
            node.dispatchEvent(
                new CustomEvent('click_outside', {detail: {originalTarget: node}})
            )
        }
    }

    document.addEventListener('click', handleClick, true)

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true)
        }
    }
}
