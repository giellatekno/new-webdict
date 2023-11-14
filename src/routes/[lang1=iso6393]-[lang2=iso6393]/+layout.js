// only run in browser
export const ssr = false;

import { error } from "@sveltejs/kit";
import { base } from "$app/paths";
import { get_meta } from "$lib/dictionary.js";

export async function load({ fetch, params }) {
    const { lang1, lang2 } = params;

    const meta = get_meta(lang1, lang2);
    if (meta === undefined) {
        throw error(404, "No such dictionary");
    }

    const trie_path = `${base}/tries/${lang1}-${lang2}.json.gz`;

    return { trie_path, meta };
}
