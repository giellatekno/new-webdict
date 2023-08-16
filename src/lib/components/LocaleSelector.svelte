<script>
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import languageIcon from "$assets/language.svg";
    import { t } from "svelte-intl-precompile";
    import { click_outside } from "$lib/click_outside.js";
    import { locale } from "$lib/locale.js";
    import { langname } from "$lib/langname.js";

    let open = false;

    function globalkeydown(ev, loc) {
        if (!open || ev.key !== "Escape") return;
        ev.preventDefault();
        open = false;
    }

    const set_locale = loc => {
        $locale = loc;
        open = false;
    }

    function onkeydown(ev) {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        open = !open;
    }

    function on_locale_keydown(ev, loc) {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        open = false;
        $locale = loc;
    }

    const LOCALES = [
        { iso: "nob", display: "Norsk Bokmål" },
        { iso: "eng", display: "English" },
        { iso: "sme", display: "Davvisámegiella" },
    ];
</script>

<svelte:window on:keydown={globalkeydown} />

<main>
    <header role="button" tabindex="0" on:keydown={onkeydown} on:click={() => open = !open}>
        <img
            alt="Innholdspråk"
            src={languageIcon}
            height="22"
        />
        <span class="lang-text">{langname($locale, $locale)}</span>
    </header>

    {#if open}
        <div
            use:click_outside={() => open = false}
            in:fly={{ y: -18, duration: 170, easing: quintOut, opacity: 0.2 }}
            out:fly={{ y: -18, duration: 120, easing: quintOut, opacity: 0 }}
            class="fullscreen"
        >
            <h1>{$t("interfacelanguage")}</h1>

            <div class="lang-container">
                {#each LOCALES as { iso, display }}
                    <div class="lang" role="button"
                         class:selected={iso == $locale}
                         tabindex="0"
                         on:click={() => set_locale(iso)}
                         on:keydown={ev => on_locale_keydown(ev, iso)}
                     >
                         {display}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</main>

<style>
    main {
        display: flex;
    }
    header {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
    }
    header > span {
        margin-left: 0.4em;
    }
    div.fullscreen {
        z-index: 20;
        color: white;
        background-color: rgba(40, 40, 40, 0.95);
        padding: 18px;
        position: absolute;
        border-radius: 8px;
        left: 34px; top: 28px;
    }
    div.fullscreen > h1 {
        margin: 0;
        font-size: 22px;
        padding-left: 16px;
    }
    div.lang-container {
        padding: 0;
        display: inline-flex;
        flex-direction: column;
    }
    div.lang {
        display: inline;
        cursor: pointer;
        margin: 4px 0 0 16px;
        font-size: 1.3em;
        border-bottom: 3px solid transparent;
        transition: border-bottom 0.25s ease-out;
    }
    div.lang.selected {
        color: red;
    }
    div.lang:hover {
        border-bottom: 3px solid white;
    }
</style>
