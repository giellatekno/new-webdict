import { gzip, gunzip, min } from "$lib/utils.js";
import { debug } from "$lib/debug_console.js";
import { IDB } from "$lib/idb.js";
import METAS from "$lib/dict_metas.js";

const DATABASE_SPEC = {
    name: "dictionaries",
    version: 1,
    stores: {
        // copy of the meta-data for the dict, plus saved
        // date (TODO should be dictionary date, but we don't
        // have that - yet)
        metas: { keyPath: ["l1", "l2"] },
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

export async function get_from_indexeddb(meta) {
    debug("get_from_indexeddb()");
    return await DATABASE.transaction(
        ["metas", "blobs"],
        "readonly",
        async ([metastore, blobstore]) => {
            const key = [meta.l1, meta.l2];
            debug("  in transaction: metastore.get_all_objects()");
            const metas = await metastore.get_all_objects(key);
            debug("  done awaiting for all objects");
            
            const meta_entry = min(metas, {
                key: meta => Date.parse(meta.date),
                default: null,
            });
            if (meta_entry === null) {
                debug("no meta entry, get_from_indexeddb() returns null");
                return null;
            }

            debug("  blobstore.get_one()");
            const blob = await blobstore.get_one(meta_entry.h);
            debug("returning gunzip(blob)");
            return await gunzip(blob);
        }
    );
}

export async function save_to_indexeddb(meta, buffer) {
    await DATABASE.transaction(
        ["metas", "blobs"],
        "readwrite",
        async ([metastore, blobstore]) => {
            await metastore.add({
                ...meta,
                date: (new Date()).toISOString(),
            });
            await blobstore.add(await gzip(buffer), meta.h);
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
