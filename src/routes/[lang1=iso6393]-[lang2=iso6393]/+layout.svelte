<script>
    import { locale } from "$lib/locale.js";
    import { langname } from "$lib/langname.js";
    import LangSelector from "$components/LangSelector.svelte";

    export let data;

    $: lang1 = langname(data.meta.l1, $locale);
    $: lang2 = langname(data.meta.l2, $locale);
</script>

<svelte:head>
    <title>{lang1} - {lang2} - Giellatekno webdict</title>
</svelte:head>

<main>
    <LangSelector meta={data.meta} />

    <slot></slot>
</main>

<style>
    main {
        padding-top: min(2em, max(3vh, 4px));
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
