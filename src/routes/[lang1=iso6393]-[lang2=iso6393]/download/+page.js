// only run in browser
export const ssr = false;

import { error } from "@sveltejs/kit";
import { get_meta } from "$lib/dictionary.js";
import dict_metas from "$lib/dict_metas.js";

export async function load({ fetch, params }) {
    const { lang1, lang2 } = params;

    const meta = get_meta(lang1, lang2);
    if (meta === undefined) {
        throw error(404, "No such dictionary");
    }

    const trie_path = `/tries/${lang1}-${lang2}.json.gz`;

    return { trie_path, meta };
}

export function entries() {
    return dict_metas.map(({ l1, l2 }) => ({ lang1: l1, lang2: l2 }));
}
