<script>
    import { base } from "$app/paths";
    import { langname } from "$lib/langname.js";
    import { locale } from "$lib/locale.js";
    import META from "$lib/dict_metas.js";

    export let meta;
    $: lang1 = meta.l1;
    $: lang2 = meta.l2;

    const can_switch = META.some(m => m.l2 === meta.l1 && m.l1 == meta.l2);
</script>

<main>
    <a href="/test">{langname(lang1, $locale)}</a>

    {#if can_switch}
        <a class="arrow" href="{base}/{lang2}-{lang1}">⇄</a>
    {:else}
        <span class="arrow">→</span>
    {/if}

    <a href="/test">{langname(lang2, $locale)}</a>
</main>

<style>
    main {
        display: flex;
        justify-items: stretch;
        align-items: center;
        width: calc(min(
            100vw, max((50vw - 16px), 300px)
        ));
        width: 100%;
    }

    main > * {
        width: 33.3333%;
        display: grid;
        place-items: center;
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

    a.arrow {
        font-size: 1.4em;
        font-weight: 400;
        color: blue;
    }

    span.arrow {
        font-size: 1.4em;
    }
</style>
