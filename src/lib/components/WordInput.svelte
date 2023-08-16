<script>
    /* WordEntry.svelte
         A styled input box for entering search words (but _not_ a "search" box).
    */
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let value = "";
    export let placeholder = "";
    export let debounce = null;

    let input;
    let timer = null;

    export function focus() {
        input.focus();
    }

    function reset() {
        window.clearTimeout(timer);
        timer = null;
        value = "";
        focus();
        dispatch("reset-value");
    }

    function on_debounced() {
        timer = null;
        dispatch("new-value", value);
    }

    function on_enter_keydown() {
        window.clearTimeout(timer);
        timer = null;
        dispatch("new-value", value);
    }

    function on_input(ev) {
        if (debounce === null) return;
        const value = ev.target.value;

        if (timer === null) {
            if (value !== "") {
                dispatch("new-input-started");
            } else {
                // suddenly after inactivity user
                // pressed ctrl+a backspace
                dispatch("reset-value");
            }
        }

        window.clearTimeout(timer);
        timer = null;

        if (value !== "") {
            timer = window.setTimeout(on_debounced, debounce);
        }
    }

    function only_on_enter(fn) {
        return function (ev) {
            if (ev.key !== "Enter") return;
            fn();
        }
    }
</script>

<div>
    <input
        bind:this={input}
        on:input={on_input}
        on:keydown={only_on_enter(on_enter_keydown)}
        bind:value
        placeholder={placeholder}
    >
    <span
        class:active={value.length > 0}
        class="cross"
        on:click={reset}
        on:keydown={only_on_enter(reset)}
        tabindex="0"
        role="button"
    >&#x2718;</span>
</div>

<style>
    div {
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        min-height: 3em;
        border-radius: 8px;
        border: 2px solid #9d9db0;
        transition:
            width ease-out 0.18s,
            border-radius ease-out 0.18s,
            border-color ease-out 0.18s;
    }
    div:focus-within {
        border-radius: 14px;
        border: 2px solid #7777ee;
        box-shadow: 0px 2px 8px 0px rgba(200, 200, 255, 0.9);
    }

    input {
        width: min(380px, max(100px, 80vw));
        margin-left: 6px;
        font-size: 16px;
        font-family: Roboto, sans-serif;
        border: 0;
        outline: 0;
        padding: 8px;
    }
    input:focus {
        border: 0;
        outline: 0;
    }
    span.cross {
        color: #9d9db0;
        /*color: gray;*/
        cursor: pointer;
        font-size: 1.5em;
        margin-right: 0.4em;
        transition: color ease-out 0.18s;
    }
    div:focus-within > span.cross.active {
        color: #f05555;
    }
</style>
