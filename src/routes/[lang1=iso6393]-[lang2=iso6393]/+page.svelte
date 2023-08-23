<script>
    import { tick } from "svelte";
    import { fade } from "svelte/transition";

    import { debug } from "$lib/debug_console.js";
    import WordInput from "$components/WordInput.svelte";
    import Progressbar from "$components/Progressbar.svelte";
    import { human_filesize } from "$lib/utils.js";
    import {
        get_from_indexeddb,
        save_to_indexeddb,
    } from "$lib/dictionary.js";
    import { Trie } from "$lib/trie.js";
    import { t } from "svelte-intl-precompile";
    import { locale, langtag_in_locale } from "$lib/locale.js";
    import { langname } from "$lib/langname.js";
    import { download } from "$lib/fetcher.js";

    export let data;

    $: lang1 = langname(data.meta.l1, $locale);
    $: lang2 = langname(data.meta.l2, $locale);

    let state = "loading";
    let dict_lemmas = null;
    let search = "";
    let results = [];
    let trie = null;
    let show_about = false;
    let size = 1; // just initialized to 1 to prevent division by zero in the progress bar
    let recieved_bytes = 0;
    let abort_signal;

    $: load_dictionary(data);
    $: results = lookup(trie, search);

    function lookup(trie, search) {
        if (trie === null || search.length === 0) return [];
        //window.performance.mark("prefix_search-start");
        const arr = Array.from(trie.prefix_search(search));
        //window.performance.mark("prefix_search-stop");
        //const x = window.performance.measure("prefix-search", "prefix_search-start", "prefix_search-stop");
        //debug(`search took ${x.duration} ms`);
        return arr;
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
        debug("load_dictionary()");
        trie = null;
        const meta = data.meta;
        dict_lemmas = meta.n;
        results = [];
        state = "initial";
        await tick();

        const db_dict = await get_from_indexeddb(meta);

        if (db_dict) {
            debug("dictionary found in idb");
            trie = Trie.from_buffer(db_dict);
            state = "ready";
            await tick();
            return;
        }

        debug("state = downloading");
        state = "downloading";
        await tick();

        size = meta.cs;

        debug("calling download()...");
        const {
            signal: signal,
            data: downloaded_data
        } = download(
            data.trie_path,
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

        debug("await downloaded data...");
        let buffer;
        try {
            buffer = await downloaded_data;
        } catch (e) {
            // error when downloading: aborted or network fail
            console.log(e);
            return;
        }

        abort_signal = null;
        trie = Trie.from_buffer(buffer);

        debug("saving dictionary to idb");
        state = "ready";
        await tick();
        await save_to_indexeddb(meta, buffer);
        debug("saved dictionary to idb");
    }
</script>

<div class="wrapper centered-column-flex">
    <a href="/{data.meta.l1}-{data.meta.l2}/download">Last ned</a>

    {#if state == "initial"}
        <!-- intentionally left blank -->
    {:else if state == "failed"}
        <p>Feil under lasting av ordbok</p>
    {:else if state == "downloading"}
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
                    {#each results as [x, y, z]}
                        <li>{x} <span class="green">{langtag_in_locale(y, $locale)}</span> → {z}</li>
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
        /*width: calc(min( 100vw, max((50vw - 16px), 300px) ));*/
        width: 100%;
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
        width: calc(min(100vw, max(50vw - 300px, 800px)));
        list-style: none;
        margin-left: 0;
        padding-left: 0;
        line-height: 1.8;
    }

    p.about {
        background-color: #deecfb;
        padding: 14px 20px;
        border-radius: 4px;
        border: 1px solid #7a7aea;
    }

    /* To color the POS in search results */
    span.green {
        color: green;
    }
</style>
