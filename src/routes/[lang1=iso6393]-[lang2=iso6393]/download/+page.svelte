<script>
    import { get_from_indexeddb } from "$lib/dictionary.js";
    import { Trie } from "$lib/trie.js";
    export let data;

    console.log(data);

    let selection = null;
    let filename = "downloaded-file.something";

    //$: can_download = selection !== null;
    $: can_download = selection === "csv";

    let a_el;
    async function do_download() {
        if (selection === "csv") {
            filename = `giellatekno-${data.meta.l1}-${data.meta.l2}.csv`;

            const db_dict = await get_from_indexeddb(data.meta);
            const trie = Trie.from_buffer(db_dict);
            const entries = Array.from(trie.prefix_search(""));
            const string = entries.join("\n");
            const utf8encoded = (new TextEncoder()).encode(string);
            const blob = new Blob([utf8encoded], { type: "text/plain" })
            const url = window.URL.createObjectURL(blob);
            a_el.href = url;
            a_el.click();
            window.URL.revokeObjectURL(url);
        } else if (selection === "standalone") {
            console.error("not implemented");
        } else {
            console.error("unreachable");
        }
    }
</script>

<h2>Last ned denne ordboka</h2>

<p>Ordboka kan lastes ned til enheten din i to forskjellige former:
    <ol>
        <li>
            Standalone HTML fil. Fila vil finnes i nedlastingsmappa,
            og vil kunne åpnes lokalt på enheten din via filutforskeren.
        </li>
        <li>
            Komma-separert liste (.csv). Dette er ei tekstfil med tre kolonner:
            lemmaet, ordklassen, og oversettelsene. Ordklassene er gitt som
            koder, f.eks "N" for substantiv (Noun), "V" for verb, osv.
        </li>
    </ol>

<main>
    <fieldset>
        <legend>Velg nedlastingsform...</legend>
    <label>
        <input type="radio" bind:group={selection} name="standalone" value="standalone" />
        Ordboka som standalone HTML fil <span style="font-weight: bold; color: red;">IKKE IMPLEMENTERT</span>
    </label>

    <label>
        <input type="radio" bind:group={selection} name="csv" value="csv" />
        Rådata som komma-separert liste (.csv)
    </label>
    </fieldset>

    <button disabled={!can_download} on:click={do_download}>Last ned</button>

    <!-- svelte-ignore a11y-missing-content a11y-missing-attribute -->
    <a bind:this={a_el} download={filename}></a>
</main>

<style>
    main, fieldset {
        display: flex;
        flex-direction: column;
    }

    label {
        font-size: 18px;
        line-height: 1.5;
    }
</style>
