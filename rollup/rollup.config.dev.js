import svelte from "rollup-plugin-svelte"
import resolve from "@rollup/plugin-node-resolve"
import livereload from "rollup-plugin-livereload"
import css from "rollup-plugin-css-only"
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const production = !process.env.ROLLUP_WATCH

function serve() {
    /** @type {import("child_process").ChildProcess | undefined} */
    let server

    function toExit() {
        if (server) server.kill(0)
    }

    return {
        writeBundle() {
            if (server) return
            server = require("child_process").spawn("npm", ["run", "start:dev", "--", "--dev"], {
                stdio: ["ignore", "inherit", "inherit"],
                shell: true
            })



            process.on("SIGTERM", toExit)
            process.on("exit", toExit)
        }
    }
}

export default {
    input: "example/main.js",
    output: {
        sourcemap: true,
        format: "es",
        name: "app",
        file: "example/public/build/bundle.js"
    },
    plugins: [
        svelte({
            compilerOptions: {
                dev: !production
            }
        }),
        css({output: "bundle.css"}),
        resolve({
            browser: true,
            exportConditions: ['svelte'],
            extensions: ['.svelte'],
            dedupe: ["svelte"]
        }),
        !production && serve(),
        !production && livereload("example/public")
    ],
    watch: {
        clearScreen: false
    }
}
