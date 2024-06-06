import svelte from "rollup-plugin-svelte"
import {sveld} from "sveld"
// import pkg from "../package.json"
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve'
import sveltePreprocess from "svelte-preprocess"
// import svelteDts from 'svelte-dts';
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


const plugins = [
    svelte(svelteConfig),
    sveld({
        typesOptions: {
            outDir: 'types',
        }
    }),
    commonjs(),
    typescript(),
    resolve(resolveConfig)
]

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
                exports: "named",
                name: "virtualScrollList",
                file: pkg.moduleOut + 'index.js',
                globals
            }
        ],
        plugins
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
                exports: "named",
                name: "virtualScrollListComponents",
                file: pkg.componentsOut.replace('.mjs', '.js'),
                globals
            }
        ],
        plugins
    }
]
