<script>
    import { onMount, onDestroy } from "svelte";
    import { debug_console } from "$lib/debug_console.js";
    import LocaleSelector from "$components/LocaleSelector.svelte";
    import { t } from "svelte-intl-precompile";
    // TEMP debug
    import { delete_database } from "$lib/dictionary.js";

    let small_console = false;
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
</script>

<svelte:head>
    <title>Giellatekno Webdict</title>
</svelte:head>

<!-- TEMP debug -->
<span class="temp">
    <button on:click={delete_database}>del db</button>
    <!--{x}, {y}-->
</span>

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

<div
    class="console"
    class:small={small_console}
    on:click={() => small_console = !small_console}
    on:keyup={() => null}
>
    <h3>dev console</h3>
    {#if !small_console}
        {#each $debug_console as msg}
            <div>{msg}</div>
        {/each}
    {/if}
</div>

<style>
    div.console {
        position: fixed;
        bottom: 0px;
        left: 0px;
        width: 100vw;
        height: 40vh;
        background-color: rgb(170, 170, 190);
        transition: height 0.4s ease-out;
        display: flex;
        flex-direction: column;
        padding: 0 5vw;
        font-family: monospace;
    }

    div.console.small {
        height: 10vh;
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

    span.temp {
        position: fixed;
        top: 10px;
        right: 10px;
    }
</style>
