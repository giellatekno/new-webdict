import { get_meta } from "$lib/dictionary.js";

// we want to pre-render this
export const prerender = true;

/** @type {import('./$types').PageServerLoad} */
export async function GET({ params }) {
    const { lang1, lang2 } = params;

    const meta = get_meta(lang1, lang2);

    if (meta === undefined) {
        return Response.json({ error: `no dictionary ${lang1}-${lang2}` });
    }

    return Response.json(meta);
}

