<script>
    import { tick } from "svelte";
    import { fade } from "svelte/transition";

    import WordInput from "$components/WordInput.svelte";
    import LangSelector from "$components/LangSelector.svelte";
    import Progressbar from "$components/Progressbar.svelte";
    import { human_filesize } from "$lib/utils.js";
    import {
        get_from_indexeddb,
        save_to_indexeddb,
    } from "$lib/dictionary.js";
    import { prefix_search, load_trie } from "$lib/trie.js";
    import { t } from "svelte-intl-precompile";
    import { locale } from "$lib/locale.js";
    import { langname } from "$lib/langname.js";
    import { download } from "$lib/fetcher.js";

    export let data;

    $: lang1 = langname(data.meta.l1, $locale);
    $: lang2 = langname(data.meta.l2, $locale);

    let state = "loading";
    let dict_lemmas = null;
    let search = "";
    let results = [];
    let dictionary = null;
    let show_about = false;
    let size = 1; // just initialized to 1 to prevent division by zero in the progress bar
    let recieved_bytes = 0;
    let abort_signal;

    $: load_dictionary(data);
    $: results = lookup(dictionary, search);

    function lookup(dictionary, search) {
        if (dictionary === null || search.length === 0)
            return [];
        return Array.from(prefix_search(dictionary, search));
    }

    function on_new_input_value({ detail: value }) {
        search = value;
    }

    function reset() {
        search = "";
    }

    function abort_download() {
        if (abort_signal) {
            abort_signal.abort();
        }
    }

    async function load_dictionary(data) {
        dictionary = null;
        const meta = data.meta;
        dict_lemmas = meta.n;
        results = [];
        state = "initial";
        await tick();

        const db_dict = await get_from_indexeddb(meta);

        if (db_dict) {
            console.log("dictionary found in idb");
            dictionary = load_trie(db_dict);
            state = "ready";
            await tick();
            return;
        }

        state = "downloading";
        await tick();
        console.log("trying the network instead");

        const url = `/${data.trie_path}`; 
        console.log("fetch url: ", url);

        size = meta.ds;

        const {
            signal,
            data: downloaded_data
        } = download(
            url,
            {
                on_start: () => recieved_bytes = 0,
                on_progress: chunk => {
                    recieved_bytes += chunk.length;
                },
                on_fail: () => state = "failed",
                on_abort: () => state = "",
                decompressed_size: size,
            }
        );

        abort_signal = signal;

        let buffer;
        try {
            buffer = await downloaded_data;
        } catch (e) {
            // error when downloading, aborted or network fail
            console.error(e);
            return;
        }

        dictionary = load_trie(buffer);
        console.log("saving dict to idb");
        state = "ready";
        await tick();
        await save_to_indexeddb(meta, buffer);
        console.log("saved dict to idb");
        abort_signal = null;
    }

    /*
    // TODO TEMP
    function temp_set_downloading() {
        state = "downloading";
        size = 152011;
        recieved_bytes = 0;

    }

    let timer;
    let animating = false;

    function update() {
        recieved_bytes += 1000;
        if (recieved_bytes > size) {
            recieved_bytes = 0;
        }
    }

    function temp_animate() {
        if (animating) {
            animating = false;
            window.clearInterval(timer);
        } else {
            timer = window.setInterval(update, 30);
            animating = true;
        }
    }
    */
</script>

<svelte:head>
    <title>{lang1} - {lang2} - Giellatekno webdict</title>
</svelte:head>

<!-- TODO TEMP -->
<!--
<button on:click={temp_set_downloading}>
    Set downloading
</button>
-->

<div class="wrapper centered-column-flex">
    <LangSelector meta={data.meta} />

    {#if state == "initial"}
        <!-- intentionally left blank -->
    {:else if state == "failed"}
        <p>Feil under lasting av ordbok</p>
    {:else if state == "downloading"}
        <!--<button on:click={temp_animate}>Animate</button>-->
        <h3>laster ordbok...</h3>
        <div>
            <span style="font-size: 22px;">
                {Math.round((recieved_bytes * 100) / size)}%
            </span>
            <span>
                {human_filesize(recieved_bytes)} /
                {human_filesize(size)}
            </span>
        </div>
        <Progressbar value={recieved_bytes} max={size} />
        <button on:click={abort_download}>Avbryt</button>
    {:else if state == "ready"}
        <div in:fade class="inner-wrapper centered-column-flex">
            <p style="margin-top: 26px;">
                {$t("words-in-dictionary")}: {dict_lemmas}
                <span
                    class="waev"
                    on:click={() => show_about = !show_about}
                    on:keypress={() => show_about = !show_about}
                >
                    {$t("about-this-dictionary")}
                </span>
            </p>
            
            {#if show_about}
                <p class="about">
                    {$t(`about-dict-${data.meta.l1}-${data.meta.l2}`)}
                </p>
            {/if}

            <div class="search-field">
                <WordInput
                    debounce={80}
                    on:new-value={on_new_input_value}
                    on:reset-value={reset}
                    on:new-input-started={reset}
                />
            </div>

            {#if results && search !== ""}
                <ul>
                    {#each results as res}
                        <li>{@html res}</li>
                    {:else}
                        <li><span style="font-style: italic;">{$t("no-search-hits")}</span></li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>

<style>
    span.waev {
        cursor: pointer;
        margin-left: 1em;
        color: blue;
        text-decoration: underline;
    }

    div.wrapper {
        padding-top: min(2em, max(3vh, 4px));
    }

    div.inner-wrapper {
        width: 50vw;
    }

    div.search-field {
        display: grid;
        place-items: center;
        margin: 26px 0 26px 0;
    }

    *.centered-column-flex {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    ul {
        list-style: none;
        margin-left: 0;
        padding-left: 0;
    }

    p.about {
        background-color: #deecfb;
        padding: 14px 20px;
        border-radius: 4px;
        border: 1px solid #7a7aea;
    }
    /* To color the POS in search results */
    :global(span.green) {
        color: green;
    }
</style>
