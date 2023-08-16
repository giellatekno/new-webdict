<script>
    import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { langname } from "$lib/langname.js";
    import { locale } from "$lib/locale.js";
    import META from "$lib/dict_metas.js";

    import Arrow from "$components/Arrow.svelte";

    export let meta;
    $: lang1 = meta.l1;
    $: lang2 = meta.l2;

    const can_switch = META
        .some(m => m.l2 === meta.l1 && m.l1 == meta.l2);

    function arrow_click() {
        if (!can_switch) return;
        goto(`/${lang2}-${lang1}`);
    }

    function onkeydown() {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        arrow_click();
    }

    let a_el;
    /*
    let timer;
    onMount(() => {
        function f() {
            const styles = window.getComputedStyle(a_el);
            console.log(styles.fontSize);
        }
        timer = window.setInterval(f, 1000);
    });

    onDestroy(() => {
        if (timer) {
            window.clearInterval(timer);
            console.debug("clearing timer");
        }
    });
    */
</script>

<main>
    <a bind:this={a_el} href="/test">
        <!--
        <svg viewBox="0 0 1000 40" style="font-size: 1em; width: 100%; height: 100%;">
            <text class="t" stroke="black" x="0" y="30">norsk bokmål</text>
            <style>
                text.t {
                    font-size: 1em;
                }
            </style>
        </svg>
        -->
        {langname(lang1, $locale)}
    </a>

    <span class="arrow">
        <Arrow
            {can_switch}
            on:click={arrow_click}
            on:keydown={onkeydown}
        />
    </span>

    <a href="/test">
        {langname(lang2, $locale)}
    </a>
</main>

<style>
    main {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        width: calc(min(
            100vw, max((50vw - 16px), 300px)
        ));
    }

    a {
        justify-self: center;
        color: black;
        text-decoration: none;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
        /*font-size: 32px;*/
        /*font-size: calc(min(8vw, 32px));*/
        font-size: clamp(18px, 4.5vw, 32px);
        font-weight: 700;
    }

    span.arrow {
        /* shouldn't need this margin */
        /*margin: 0 26px;*/
    }
</style>
