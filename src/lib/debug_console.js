import { writable } from "svelte/store";

const debug_console = writable([]);

function debug(msg) {
    debug_console.update(arr => [...arr, msg]);
    console.log(msg);
}

export { debug, debug_console };
