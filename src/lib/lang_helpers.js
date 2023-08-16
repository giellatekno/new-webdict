import METAS from "$lib/dict_metas.js";

/* find_dictionaries()
 * @param from: null or 3-letter iso code
 * @param to: null or 3-letter iso code
 * Returns Array: all dictionaries that goes from language
 *   `from` to language `to`. null means any language.
 */
export function find_dictionaries(from, to) {
    if (from === null) {
        if (to === null) {
            return [...METAS];
        } else {
            return METAS.filter(meta => meta.l2 === to);
        }
    } else {
        if (to === null) {
            return METAS.filter(meta => meta.l1 === from);
        } else {
            return [
                METAS.find(
                    meta => meta.l1 === from && meta.l2 === to
                )
            ];
        }
    }
}

