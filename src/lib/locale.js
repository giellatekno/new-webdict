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

const LANGTAGS = {
    nob: {
        A: "adj.",
        Adv: "adverb",
        CC: "konj.",
        CS: "subjunk.",
        Det: "Det",
        Interj: "interj.",
        N: "subst.",
        Num: "tallord",
        Pcle: "partikkel",
        Phrase: "Frase",
        Po: "postposisjon",
        Pr: "preposisjon",
        Pron: "pronomen",
        Prop: "egennavn",
        V: "verb",
    }
};

// set av alle pos="..." som finnes i ordbøkene:
// Counter({
// 'N': 540591,
// 'V': 251449,
// 'A': 109210,
// 'Adv': 45150,
// 'Phrase': 15179,
// 'v': 13444,
// 'xxx': 8212,
// 'Xxx': 8088,
// 'n': 6781,
// 'Pron': 4870,
// 'Prop': 3220,
// 'Po': 3170,
// 'Prc': 2903,
// 'Num': 2523,
// 'Interj': 1874,
// 'Descr': 1802,
// 'ADJ': 1620,
// 'Pr': 1402,
// 'сущ.': 1388,
// 'Pcle': 1366,
// 'PRED': 1160,
// 'CS': 689,
// 'глаг.': 620,
// 'Det': 599,
// 'a': 587,
// 'adv': 536,
// 'CC': 500,
// 'Ger': 424,
// 'Adp': 419,
// 'Desc': 411,
// 'ADV': 323,
// '': 290,
// None: 275,
// 'mwe': 168, 'ALSO_PRED': 136, 'прилаг.опред.': 131, 'Onom': 127, 'нареч.': 124, 'прилаг.': 103, 'Qnt': 102, 'N(::)': 71, 'Conj': 63, 'числ.': 59, 'NN': 53, 'мест.': 47, 'INF': 45, 'V(V::V)': 43, 'Parenth': 41, 'POSLELOG': 40, 'pro': 36, 'Suf': 33, 'Prefix': 33, 'A ': 31, 'прилаг. сущ.': 23, 'PHRASE': 22, 'BEZL': 20, 'N(V::N)': 18, 'Ad-A': 17, 'прич.': 15, 'PCLE-MOD': 14, 'MEZHD': 12, 'Suff': 12, 'собст.': 11, 'Suff/A': 10, 'Abbr': 9, 'Qu': 9, 'Cmp': 9, 'Pref': 8, 'сущ. сущ.': 7, 'num': 6, 'част.': 6, 'N(N::N)': 6, 'прилаг.сказ.': 6, 'mwe._NP: прилаг. сущ.': 5, 'с.': 5, 'глаг. мест.': 5, 'послел.': 4, 'PODR': 4, 'A N': 4, 'VSPOM_GL': 4, 'SOJUZ': 4, 'INTERJ': 4, 'глаг. предл. сущ.': 4, 'Case': 3, 'Clt': 3, 'Po;Adv': 3, 'предл. сущ.': 3, 'Inter': 2, 'Ord': 2, 'числ.неопред.': 2, 'mwe._AP: нареч. прилаг.': 2, 'Art': 2, 'V::N': 2, 'A::N': 2, 'CC::Adv::Adv': 2, 'CS(Pr::Pr::Pron::CS)': 2, 'сущ. предл. сущ. ': 2, 'глаг. прилаг. сущ.': 2, 'предл. мест.': 2, 'respons': 1, 'V-Aux': 1, 'Pred': 1, 'AdA': 1, 'CONJ': 1, 'mwe._NP: прилаг. прилаг. сущ. ': 1, 'mwe._VP: глаг. сущ. ': 1, 'союс': 1, 'V::Adv': 1, 'нареч': 1, 'I': 1, 'Phrase_A': 1, 'Phrase_V': 1, 'CS(Pr::N::Pr::CS)': 1, 'A  ': 1, 'Suff/Adv': 1, 'N(A;N)': 1, 'Bahuv': 1, 'CS(CS::CC)': 1, 'V(N::V)': 1, 'V(Descr::V)': 1, 'Det;Adv': 1, 'Det;A': 1, 'Num(Num::Num)': 1, 'A(N::Po)': 1, 'N(A::N)': 1, 'N(N::Adv::N)': 1, 'глаг. нареч.': 1, 'глаг. предл. мест.': 1, 'глаг. сущ. ': 1, 'глаг. глаг.': 1, 'сущ. предл. с. сущ. прилаг. сущ. ': 1})

function langtag_in_locale(langtag, locale) {
    const tags = LANGTAGS[locale];
    if (tags === undefined) {
        console.warn(`langtag_in_locale(): unknown locale '${locale}'`);
        return "";
    }

    const tag = tags[langtag];
    if (tag === undefined) {
        console.warn(`langtag_in_locale(): unknown POS tag '${langtag}`);
        return langtag;
    }

    return tag;
}

export { locale, langtag_in_locale };
