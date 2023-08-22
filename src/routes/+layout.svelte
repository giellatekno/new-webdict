<script>
    import { onMount, onDestroy } from "svelte";

    import { fly } from "svelte/transition";
    import { debug_console, debug } from "$lib/debug_console.js";
    import LocaleSelector from "$components/LocaleSelector.svelte";
    import { t } from "svelte-intl-precompile";
    // TEMP debug
    import { delete_database } from "$lib/dictionary.js";

    let console_hidden = false;
    function close_console() { console_hidden = true; }
    // TEMP debug
    /*
    let x = 0;
    let y = 0;
    function mpos(ev) { x = ev.pageX; y = ev.pageY; }
    onMount(() => {
        document.body.addEventListener("mousemove", mpos);
    });
    onDestroy(() => {
        // this crashes sveltekit (!!)
        //document.body.removeEventListener("mousemove", mpos);
    });

    onMount(async () => {
        console.log("routes/+layout.svelte: in browser");
    });
    */

    function hit_zone(x, y, w, h) {
        if (y >= (3/4)*h) {
            // lower quartant of screen
            return x > w / 2 ? "right" : "left";
        }
        return null;
    }
    let hz_expected_next = "any";
    let hz_timer = null;
    let hz_count = 0;

    function hz_clear() {
        if (hz_timer) window.clearTimeout(hz_timer);
        hz_timer = null;
        hz_count = 0;
        hz_expected_next = "any";
    }

    function check_dev_console_opening_sequence(ev) {
        if (!console_hidden) return;
        const { clientX: x, clientY: y } = ev;
        const w = window.visualViewport.width;
        const h = window.visualViewport.height;
        const hz = hit_zone(x, y, w, h);
        if (hz === null) {
            hz_clear();
            return;
        }

        if (hz_count === 0) {
            hz_expected_next = hz === "left" ? "right" : "left";
            hz_count++;
        } else {
            if (hz !== hz_expected_next) {
                hz_clear();
                return;
            }

            if (++hz_count >= 4) {
                console_hidden = false;
            } else {
                hz_expected_next = hz === "left" ? "right" : "left";
            }
        }
        //console.log(`(y=${y}, x=${x}). h=${h}, w=${w}`);
        //console.log(`hit_zone: ${hit_zone(x, y, w, h)}`);
    }
</script>

<svelte:head>
    <title>Giellatekno Webdict</title>
</svelte:head>

<svelte:window on:click={check_dev_console_opening_sequence} />

<div class="wrapper">
    <div>
        <LocaleSelector />
    </div>
    <header>
        <a class="big" href="/">Giellatekno Webdict</a>
        <a class="small" href="/all">{$t("dictionaries")}</a>
    </header>
    <div class="line"></div>
    <main>
        <div class="content">
            <slot></slot>
        </div>
    </main>
</div>

{#if !console_hidden}
    <div
        class="console"
        on:click|self={close_console}
        on:keyup={() => null}
        transition:fly={{ y: 100 }}
    >
        <div on:click={close_console} style="display: flex; justify-content: space-between;">
            <h3 on:click={close_console} on:keyup={_=>0}>dev console</h3>
            <button on:click={delete_database}>del db</button>
        </div>
        <div class="inner" id="debug-console">
            {#each $debug_console as msg}
                <div>{msg}</div>
            {/each}
        </div>
    </div>
{/if}

<style>
    div.console {
        position: fixed;
        bottom: 0px;
        left: 0px;
        width: 100vw;
        height: 40vh;
        background-color: rgb(170, 170, 190);
        display: flex;
        flex-direction: column;
        padding: 0 3vw 25px 3vw;
        font-family: monospace;
        box-sizing: border-box;
    }

    div.inner {
        height: 100%;
        overflow-y: scroll;
        padding: 4px 12px;
        border: 1px solid black;
    }

    div.wrapper {
        width: 100vw;
    }

    div.line {
        border-bottom: 1px solid silver;
        width: calc(100vw - 16px);
    }

    header {
        padding-bottom: 8px;
        margin: 5px 0 0 20px;
    }

    a {
        color: black;
        font-family: verdana;
    }

    a.big {
        text-decoration: none;
        font-family: verdana;
        font-size: 26px;
        font-weight: 100;
    }

    a.small {
        font-size: 16px;
        margin-left: 16px;
    }

    main {
        display: flex;
        justify-content: center;
    }

    div.content {
        width: min(max(a, b), c);
        /*width: 50%;*/
    }
</style>
