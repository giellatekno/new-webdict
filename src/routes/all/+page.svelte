<script>
    import { onMount } from "svelte";
    import { flip } from 'svelte/animate';
    import { quintOut } from 'svelte/easing';
    import { human_filesize } from "$lib/utils.js";
    import { saved_dictionaries } from "$lib/dictionary.js";
    import { langname } from "$lib/langname.js";
    import { debug } from "$lib/debug_console.js";
    import { t } from "svelte-intl-precompile";
    import { locale } from "$lib/locale.js";
    import { nbsp } from "$lib/utils.js";
    import { array_sort_subslice, array_order_in_groups } from "$lib/array_utils.js";
    import DICTMETAS from "$lib/dict_metas.js";
    import { download } from "$lib/fetcher.js";
    import Progressbar from "$components/ProgressbarSmall.svelte";

    let saved_dicts = [];

    let dicts = [];
    let total_size = "?";

    const downloads = {};
    const dict_ordering = (a, b) => b.n - a.n;

    function check_duplicates() {
        console.log("checking for duplicates");
        let n = 0;
        const has = new Map();
        for (const d of dicts) {
            if (has.has(d.h)) {
                n++;
                console.log("duplicate!", d);
            } else {
                has.set(d.h, d);
            }
        }
        console.log(`${n} duplicates found`);
    }

    function order(dicts) {
        console.log("ordering dictionaries...");
        const n_saved = dicts
            .map(d => d.status)
            .filter(status => status === "saved")
            .length;

        array_order_in_groups(dicts,
            element => element.status === "saved",
            element => element.status !== "saved",
        );

        console.log("1", dicts.length, dicts);
        console.log(n_saved);
        array_sort_subslice(dicts, 0, n_saved - 1, dict_ordering);
        console.log("2", dicts.length, dicts);
        array_sort_subslice(dicts, n_saved, dicts.length - 1, dict_ordering);
        console.log("3", dicts.length, dicts);

        return dicts;
    }

    onMount(async () => {
        saved_dicts = await saved_dictionaries();
        debug(saved_dicts);
        const saved_map = new Map((function*() {
            for (const saved of saved_dicts) {
                yield [saved.h, { ...saved }];
            }
        })());

        dicts = DICTMETAS.map(d => ({
            ...d,
            status: saved_map.has(d.h) ? "saved" : "unsaved"
        }));

        check_duplicates();

        dicts = order(dicts);

        const sum = (acc, cur) => acc + cur.cs;
        total_size = human_filesize(saved_dicts.reduce(sum, 0));
    });

    function delete_dict(h) {
    }

    async function download_dict(h) {
        const dict_index = dicts.findIndex(d => d.h === h);
        dicts[dict_index].status = "downloading";
        const meta = dicts[dict_index];

        const url = `/tries/${meta.l1}-${meta.l2}-lr-trie.min.xml.gz`;
        console.log(url);
        const { signal, data } = download(url, {
            on_progress: chunk => {
                downloads[h].current += chunk.length;
            },
        });

        downloads[h] = { size: meta.ds, current: 0 };

        let buffer;
        try {
            buffer = await data;
        } catch(e) {
            console.error("failure when downloading");
            return;
        }

        delete downloads[h];
        meta.status = "saved";

        dicts = order(dicts);
    }
</script>

<main>
    <h1>{$t("dictionaries")}</h1>

    <p class="about">{$t("offline-use-paragraph")}</p>

    <div class="header">
        <span>Totalt lagret: {total_size}</span>
    </div>


    <div class="table">
        {#each dicts as { l1, l2, cs, n, h, status } (h)}
            <div
                class="row"
                animate:flip={{ easing: quintOut, duration: 1000 }}
            >
                <span class="name">
                    <a href="/{l1}-{l2}">
                        {langname(l1, $locale)} → {langname(l2, $locale)}
                    </a>
                </span>
                <span class="size">
                    {n}&nbsp;lemma&nbsp;<span class="smaller">({nbsp(human_filesize(cs))})</span>
                </span>
                <span class="status">
                    {#if status === "saved"}
                        <button
                            class="delete"
                            on:click={() => delete_dict(h)}
                        >
                            {$t("delete")}
                        </button>
                    {:else if status === "unsaved"}
                        <button
                            class="download"
                            on:click={download_dict(h)}
                        >
                            {nbsp($t("save"))}
                        </button>
                    {:else if status === "downloading"}
                        <Progressbar value={downloads[h].current} max={downloads[h].size} />
                    {/if}
                </span>
            </div>
        {/each}
    </div>
</main>

<style>
    main {
        width: clamp(350px, 40vw, 700px);
    }

    div.header {
        display: flex;
        justify-content: end;
        padding-bottom: 8px;
    }

    p.about {
        background-color: #deecfb;
        padding: 14px 20px;
        border-radius: 4px;
        border: 1px solid #7a7aea;
    }

    button {
        cursor: pointer;
        border: none;
        font-size: 18px;
        padding: 3px 16px;
        border-radius: 3px;
        font-variant: small-caps;
        width: 100%;
        min-width: 107px;
    }

    button.delete {
        background-color: #f76969;
        min-width: 107px;
    }
    button.download {
        min-width: 107px;
        background-color: #f2ca97;
        border: 1px solid #ac8e30;
        transition:
            background-color 0.2s ease-out,
            border-color 0.2s ease-out;
    }
    button.download:hover {
        background-color: #f0ef8a;
        border-color: black;
    }

    div.table {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
        width: 100%;
    }

    div.row {
        display: flex;
        align-items: center;
        height: 30px;
        width: 100%;
    }

    div.row > span.name {
        margin-right: auto;
        justify-self: start;
    }

    div.row > span.status {
        justify-self: end;
        min-width: 97px;
        padding-left: 8px;
    }

    span.smaller {
        font-size: 12px;
    }

    @media screen and (max-width: 530px) {
        span.smaller {
            display: none;
        }
    }
</style>
