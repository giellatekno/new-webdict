import { gzip, gunzip, min } from "$lib/utils.js";
import { debug } from "$lib/debug_console.js";
import { IDB } from "$lib/idb.js";
import METAS from "$lib/dict_metas.js";

const DATABASE_SPEC = {
    name: "dictionaries",
    version: 2,
    stores: {
        // copy of the meta-data for the dict, keyed by hash
        metas: { keyPath: "h" },
        // no the gzipped xml data, keyed out-of-line by hash
        blobs: {},
    },
};

const DATABASE = new IDB(DATABASE_SPEC);

export function get_meta(lang1, lang2) {
    return METAS.find(m => m.l1 === lang1 && m.l2 === lang2);
}

export function total_lemmas(lang) {
    return METAS
        .filter(m => m.l1 === lang)
        .map(m => m.n)
        .reduce((acc, cur) => acc + cur, 0);
}

export async function delete_database() {
    await DATABASE.delete_database();
}

// Get the dictionary in the idb for this meta,
// return arraybuffer of decompressed data on success, or
// undefined if the corresponding data for the 'meta' was not found
export async function get_from_indexeddb(meta) {
    debug("enter get_from_indexeddb()", meta);
    return await DATABASE.transaction(
        ["metas", "blobs"],
        "readonly",
        async ([metastore, blobstore]) => {
            const blob = await blobstore.get(meta.h);
            if (blob === undefined) {
                return undefined;
            } else {
                debug("return from get_from_indexeddb()");
                return await gunzip(blob);
            }
        }
    );
}

export async function save_to_indexeddb(meta, buffer, { allow_replace = false } = {}) {
    await DATABASE.transaction(
        ["metas", "blobs"],
        "readwrite",
        async ([metastore, blobstore]) => {
            await metastore.add({ ...meta }, { allow_replace });
            await blobstore.add(await gzip(buffer), { key: meta.h, allow_replace });
        },
    );
}

export async function delete_from_indexeddb(hash) {
    return await DATABASE.transaction(
        ["metas", "blobs"],
        "readwrite",
        async ([metastore, blobstore]) => {
            throw new Error("unimplemented");
            //await blobstore.delete(hash);
            //await metastore.delete(...);
        },
    );
}

// list all dictionaries we have saved
export async function saved_dictionaries() {
    return await DATABASE.transaction(
        ["metas"],
        "readonly",
        async ([metastore]) => {
            const all = await metastore.get_all();
            const objects = all.map(([_key, object]) => object);
            return objects;
        }
    );
}
