import svelte from "rollup-plugin-svelte"
import sveld from "sveld"
import pkg from "../package.json"
import resolve from '@rollup/plugin-node-resolve'
import sveltePreprocess from "svelte-preprocess"

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
            }
        ],
        plugins: [
            svelte({
                preprocess: sveltePreprocess({
                    sourceMap: true
                }),
                compilerOptions: {
                    // enable run-time checks when not in production
                    dev: false
                },
                emitCss: false
            }),
            sveld(),
            resolve(resolveConfig)
        ]
    },
    {
        input: pkg.componentsIn,
        output: {
            sourcemap: true,
            format: "es",
            name: "virtualScrollListComponents",
            file: pkg.componentsOut,
            globals
        },
        plugins: [
            svelte({
                preprocess: sveltePreprocess({
                    sourceMap: true
                }),
                compilerOptions: {
                    // enable run-time checks when not in production
                    dev: false
                },
                emitCss: false
            }),
            sveld(),
            resolve(resolveConfig)
        ]
    }
]
