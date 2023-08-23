<script>
    import { tick } from "svelte";
    import { get_from_indexeddb } from "$lib/dictionary.js";
    import { Trie } from "$lib/trie.js";
    import standalone_html_template from "$assets/standalone.template.html?raw";
    export let data;

    //console.log(standalone_html_template);
    let a_el;
    let selection = null;
    let filename = "downloaded-file.something";

    $: can_download = selection === "csv" || selection === "standalone";

    async function do_download() {
        if (selection !== "csv" && selection !== "standalone") {
            return;
        }

        console.log("selection", selection);
        const db_dict = await get_from_indexeddb(data.meta);
        let file_contents = "[TO BE REPLACED]";
        let mimetype = "?";

        if (selection === "csv") {
            filename = `giellatekno-${data.meta.l1}-${data.meta.l2}.csv`;
            await tick();
            mimetype = "text/plain";

            const trie = Trie.from_buffer(db_dict);
            const entries = Array.from(trie.prefix_search(""));
            file_contents = entries.join("\n");
        } else if (selection === "standalone") {
            filename = `giellatekno-${data.meta.l1}-${data.meta.l2}.html`;
            await tick();
            mimetype = "text/html";
            file_contents = standalone_html_template.replaceAll("{%lang1%}", data.meta.l1);
            file_contents = file_contents.replaceAll("{%lang2%}", data.meta.l2);
            const trie_string = (new TextDecoder()).decode(db_dict).replaceAll("'", "\\'");;
            file_contents = file_contents.replaceAll("{%DATA%}", trie_string);
        } else {
            console.error("unreachable");
        }

        const utf8encoded = (new TextEncoder()).encode(file_contents);
        const blob = new Blob([utf8encoded], { type: mimetype })
        const url = window.URL.createObjectURL(blob);
        a_el.href = url;
        a_el.click();
        window.URL.revokeObjectURL(url);
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
        Ordboka som standalone HTML fil
    </label>

    <label>
        <input type="radio" bind:group={selection} name="csv" value="csv" />
        Rådata som komma-separert liste (.csv)
    </label>
    </fieldset>

    <button disabled={!can_download} on:click={do_download}>Last ned</button>

    eller

    <a href="/{data.meta.l1}-{data.meta.l2}">Gå tilbake</a>

    <!-- svelte-ignore a11y-missing-content a11y-missing-attribute -->
    <a bind:this={a_el} download={filename}></a>
</main>

<style>
    main, fieldset {
        display: flex;
        flex-direction: column;
    }

    fieldset {
        padding: 8px 20px;
    }

    label {
        font-size: 18px;
        line-height: 2;
    }
</style>
