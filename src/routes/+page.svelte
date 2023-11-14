<script>
    import { base } from "$app/paths";
    import { langname } from "$lib/langname.js";
    import { locale } from "$lib/locale.js";
    import META from "$lib/dict_metas.js";

    const rest = META.map(({ l1, l2 }) => [l1, l2]);

    function get_langs(lang) {
        return META.filter(m => m.l1 === lang).map(m => m.l2);
    }

    const lang_categories = [
        {
            summary: "Samiske språk",
            langs: ["smn", "sjd", "smj", "sme", "sms", "sma", "sjt"],
        },
        {
            summary: "Østersjøfinske språk",
            langs: ["est", "fin", "fkv", "olo", "vot", "vro"],
        },
        {
            summary: "Andre uralske språk",
            langs: ["myv", "koi", "mns", "mdf", "kpv", "udm", "hun", "mrj", "mhr"],
        },
        {
            summary: "Indoeuropeiske språk",
            langs: ["eng", "lav", "nob", "ron", "rus", "swe", "deu"],
        },
        {
            summary: "Andre språk",
            langs: ["chr", "hdn", "otw", "som", "srs"],
        },
    ];

    let all_open = false;
    function expand_all() {
        all_open = !all_open;
    }
</script>

<main>
    <h2>Giellatekno Webdict</h2>
    <p>Ei enkel og rask ordbok, som også fungerer offline.</p>
    <h2>
        Våre ordbøker
        <span on:click={expand_all} class="expand">
            ({#if all_open}lukk{:else}åpne{/if} alle)
        </span>
    </h2>

    <section class="langs">
        {#each lang_categories as { summary, langs }}
            <details open>
                <summary>{summary}</summary>
                <ul>
                    {#each langs as l1}
                        <li>
                            <details open={all_open}>
                                <summary>{langname(l1, "nob")}</summary>
                                <ul class="inner">
                                    {#each get_langs(l1) as l2}
                                        <li>
                                            <a href="{base}/{l1}-{l2}">
                                                {langname(l1, "nob")}
                                                &nbsp;→&nbsp;
                                                {langname(l2, "nob")}
                                            </a>
                                        </li>
                                    {/each}
                                </ul>
                            </details>
                        </li>
                    {/each}
                </ul>
            </details>
        {/each}
    </section>
</main>

<style>
    p {
        font-size: 22px;
        font-style: italic;
    }

    main {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    span.expand {
        cursor: pointer;
        color: blue;
        font-size: 0.8em;
    }

    section.langs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 16px;
    }

    ul {
        list-style: none;
    }

    ul.inner > li {
        padding: 6px 0px;

    }

    details > summary {
        padding: 2px 6px;
        font-size: 1.2em;
        width: 15em;
        border: none;
        cursor: pointer;
    }
</style>
