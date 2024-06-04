import svelte from "rollup-plugin-svelte"
import {sveld} from "sveld"
// import pkg from "../package.json"
import resolve from '@rollup/plugin-node-resolve'
import sveltePreprocess from "svelte-preprocess"
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pkg = require("../package.json")


const globals = {
    'svelte/internal': 'svelte/internal',
    'svelte': 'svelte'
}

const resolveConfig = {
    browser: true,
    resolveOnly: [/^(?!svelte.*$)/],
    exportConditions: ['svelte'],
    extensions: ['.svelte'],
    dedupe: ["svelte"]
}

const svelteConfig = {
    preprocess: sveltePreprocess({
        sourceMap: true
    }),
    compilerOptions: {
        enableSourcemap: true,
        // enable run-time checks when not in production
        dev: false
    },
    emitCss: false
}



export default [
    {
        input: pkg.svelte,
        output: [
            {
                sourcemap: true,
                format: "es",
                name: "virtualScrollList",
                file: pkg.moduleOut + 'index.mjs',
                globals
            },
            {
                sourcemap: true,
                format: "umd",
                name: "virtualScrollList",
                file: pkg.moduleOut + 'index.js',
                globals
            }
        ],
        plugins: [
            svelte(svelteConfig),
            sveld(),
            resolve(resolveConfig)
        ]
    },
    {
        input: pkg.componentsIn,
        output: [
            {
                sourcemap: true,
                format: "es",
                name: "virtualScrollListComponents",
                file: pkg.componentsOut,
                globals
            },
            {
                sourcemap: true,
                format: "umd",
                name: "virtualScrollListComponents",
                file: pkg.componentsOut.replace('.mjs', '.js'),
                globals
            }
        ],
        plugins: [
            svelte(svelteConfig),
            sveld(),
            resolve(resolveConfig)
        ]
    }
]
