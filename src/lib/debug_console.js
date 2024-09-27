import { tick } from "svelte";
import { writable } from "svelte/store";

const debug_console = writable([]);

async function debug(...msg) {
    debug_console.update(arr => [...arr, ...msg]);
    await tick();
    console.log(...msg);

    if (typeof window !== "undefined") {
        const element = window.document.getElementById("debug-console");
        if (element) {
            element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
        }
    }
}

export { debug, debug_console };
