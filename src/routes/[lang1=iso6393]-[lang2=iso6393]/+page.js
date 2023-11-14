// only run in browser
export const ssr = false;

import { error } from "@sveltejs/kit";
import { base } from "$app/paths";
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

// The dictionaries are dynamic pages, because of the slug
// [lang1]-[lang2], so SvelteKit cannot know what these values
// are, so we have to define it here (other places are possible)
// so that SvelteKit knows which pages to prerender.
// See https://kit.svelte.dev/docs/page-options#prerender-troubleshooting
// See https://kit.svelte.dev/docs/page-options#entries
export function entries() {
    return [];
}
