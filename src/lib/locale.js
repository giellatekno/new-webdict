import { writable } from "svelte/store";
import { addMessages, init, locale as precompile_locale } from "svelte-intl-precompile";
import nob from "../locales/nob.js";
import eng from "../locales/eng.js";
import sme from "../locales/sme.js";

addMessages("nob", nob);
addMessages("eng", eng);
addMessages("sme", sme);

init({ initialLocale: "nob", fallbackLocale: "nob" });

// Create a store that wraps the "t" store, but
// also saves currently saved locale to localStorage
function make_locale_store() {
    const inner = precompile_locale;

    function set(value) {
        inner.set(value);
        window.localStorage.setItem("locale", value);
    }

    return {
        subscribe: inner.subscribe,
        set,
    }
}

const locale = make_locale_store();

export { locale };
