<script>
    import { langname } from "$lib/langname.js";
    import { locale } from "$lib/locale.js";
    import META from "$lib/dict_metas.js";

    const most_used = [
        [ "sme", "nob" ],
        [ "nob", "sme" ],
        [ "sma", "nob" ],
        [ "nob", "sma" ],
    ];

    function not_in_most_used([l1, l2]) {
        for (let pair of most_used) {
            if (pair[0] === l1 && pair[1] === l2) {
                return false;
            }
        }
        return true;
    }
    const rest = META
        .map(({ l1, l2 }) => [l1, l2])
        .filter(not_in_most_used);
</script>

<main>
    <h2>Giellatekno Webdict</h2>
    <p>Ei enkel og rask ordbok, som også fungerer offline.</p>
    <h2>Våre ordbøker</h2>

    <div class="mostused">
        {#each most_used as [l1, l2]}
            <a href="{l1}-{l2}">
                {langname(l1, $locale)}&nbsp;→&nbsp;{langname(l2, $locale)}
            </a>
        {/each}
    </div>

    <div class="rest">
        {#each rest as [l1, l2]}
            <a href="{l1}-{l2}">
                {langname(l1, $locale)}&nbsp;→&nbsp;{langname(l2, $locale)}
            </a>
        {/each}
    </div>
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

    div.mostused {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 26px;
    }

    div.mostused > a {
        font-size: 26px;
    }

    div.rest {
        margin-top: 3em;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-gap: 16px;
    }
</style>
