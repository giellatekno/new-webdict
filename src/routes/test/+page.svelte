<script>
    import { tweened } from "svelte/motion";
    import { flip } from "svelte/animate"
    import { quintOut } from "svelte/easing";

    import { goto } from "$app/navigation";
    import META from "$lib/dict_metas.js";
    import Arrow from "$components/Arrow.svelte";
    import { locale } from "$lib/locale.js";
    import { langname } from "$lib/langname.js";
    import { find_dictionaries } from "$lib/lang_helpers.js";
    import { total_lemmas } from "$lib/dictionary.js";
    import { array_swap } from "$lib/array_utils.js";

    let selected_lang1 = null;
    let selected_lang2 = null;

    const flip_opts = { duration: 850, easing: quintOut };

    const FROM_LANGS = Array.from(new Set(META.map(m => m.l1)));
    const TO_LANGS = Array.from(new Set(META.map(m => m.l2)));

    let into_langs = TO_LANGS.map(l => ({ l2: l }));
    let from_langs = FROM_LANGS
        .map(l => ({ l1: l, tot_lemmas: total_lemmas(l) }))
    from_langs.sort((a, b) => b.tot_lemmas - a.tot_lemmas);
    from_langs = from_langs;

    function on_mouse_enter_1(lang) {
        if (selected_lang1) return;

        const pairs = find_dictionaries(lang, null);
        for (const pair of pairs) {
            const l2 = into_langs.find(L => pair.l2 === L.l2);
            l2.highlighted = true;
        }
        // gray out the others
        for (const IL of into_langs) {
            IL.grayed = !IL.highlighted;
        }
        into_langs = into_langs; // invalidate
    }

    function on_mouse_enter_2(lang) {
        console.log("on_mouse_enter_2()");
        const others = find_dictionaries(null, lang);
        for (const other of others) {
            const found = from_langs.find(
                L => other.l1 === L.l1
            );

            found.highlighted = true;
        }
        from_langs = from_langs; // invalidate
    }

    function on_mouse_leave_1() {
        // kind of right, but not quite..
        if (selected_lang1) return;

        for (const IL of into_langs) {
            IL.highlighted = false;
            IL.grayed = false;
        }
        into_langs = into_langs; // invalidate
    }

    function on_mouse_leave_2() {
        for (const from_lang of from_langs) {
            from_lang.highlighted = false;
        }
        from_langs = from_langs; // invalidate
    }

    function on_mouse_click_1(lang) {
        if (selected_lang1 === lang) return;

        const others = find_dictionaries(lang, null);
        for (const other of others) {
            const found = into_langs.find(
                L => other.l2 === L.l2
            );

            found.highlighted = true;
        }
        into_langs = order(into_langs); // invalidate

        // put selected one first
        for (let i = 0; i < from_langs.length; i++) {
            const current = from_langs[i];
            if (current.l1 === lang) {
                current.selected = true;
                selected_lang1 = current.l1;
                array_swap(from_langs, 0, i);
            } else {
                current.selected = false;
            }
        }
        from_langs = order(from_langs); // invalidate
    }

    function on_mouse_click_2(lang) {
        if (selected_lang1) {
            // we want to go to 
            goto(`${selected_lang1}-${lang}`);
        } else {
            console.debug("unimplemented");
        }
    }

    // our custom ordering:
    // selected one always first,
    // then highlighted (internally ordered by num lemmas)
    // then others (internally ordered by num lemmas)
    function order(array) {
        const have_selected = selected_first(array);
        const num_highligted = order_highlighted(
            array, have_selected ? 1 : 0);
        return array;
    }

    function selected_first(array) {
        const selected = array.findIndex(el => el.selected);
        if (selected === -1) return false;
        array_swap(array, 0, selected);
        return true;
    }

    function order_highlighted(array, start) {
        let n = 0, i = start;
        while (array[i].highlighted) i++;

        for (let j = i; j < array.length; j++) {
            const current = array[j];
            if (current.highlighted) {
                array_swap(array, i, j);
                i++;
                n++;
            }
        }
        return n;
    }

</script>

<div class="main">
    <div class="column">
        {#each from_langs as { highlighted, selected, grayed, l1 } (l1)}
            <button
                class="lang"
                class:selected
                class:highlighted
                class:grayed
                animate:flip={flip_opts}
                on:click={() => on_mouse_click_1(l1)}
                on:mouseenter={() => on_mouse_enter_1(l1)}
                on:mouseleave={on_mouse_leave_1}
            >
                {langname(l1, $locale)}
            </button>
        {/each}
    </div>
    <div class="arrow">
        <Arrow />
        <!--→-->
    </div>
    <div class="column">
        {#each into_langs as { highlighted, selected, grayed, l2 } (l2)}
            <button
                class="lang"
                class:selected
                class:highlighted
                class:grayed
                animate:flip={flip_opts}
                on:click={() => on_mouse_click_2(l2)}
                on:mouseenter={() => on_mouse_enter_2(l2)}
                on:mouseleave={on_mouse_leave_2}
            >
                {langname(l2, $locale)}
            </button>
        {/each}
    </div>
</div>


<style>
    div.main {
        display: grid;
        grid-template-columns: 1fr 20px 1fr;
    }

    div.column {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    div.arrow {
        justify-content: center;
    }

    button.lang {
        cursor: pointer;
        background-color: white;
        font-size: 22px;
        margin: 4px 0;
        padding: 6px 20px;
        /*border: 1px solid rgb(170, 170, 240);*/
        border: none;
        border-radius: 30px;
        width: 8em;
        transition:
            background-color 0.3s ease-out,
            color 0.3s ease-out;
    }

    button.grayed {
        color: gray;
    }

    button.highlighted {
        font-weight: bold;
        color: blue;
        /*background-color: #7a7aea;*/
    }

    button.selected {
        font-weight: bold;
        /*background-color: blue;*/
    }

    button.lang:hover {
        color: blue;
        font-weight: bold;
    }
</style>
