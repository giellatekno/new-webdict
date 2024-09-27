// Won't really be measuring anything bigger than megabytes, but whatever..
const _filesize_prefixes = {
    si: {
        short: [
            "K", "M", "G", "T", "P", "E", "Z", "Y"
        ],
        long: [
            "Kilo", "Mega", "Giga", "Tera",
            "Peta", "Exa", "Zetta", "Yotta"
        ],
    },
    binary: {
        short: [
            "Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi", "Yi"
        ],
        long: [
            "Kibi", "Mebi", "Gibi", "Tebi",
            "Pebi", "Exbi", "Zebi", "Yobi"
        ],
    }
};

export function fmt_filesize(
    bytes,
    {
        long_units = false,
        use_binary_units = false,
        decimal_places = 2,
    } = {}
) {
    if (typeof bytes !== "number") {
        throw new TypeError(`fmt_filesize(): argument 'bytes': expected a number, not ${typeof bytes}`);
    } else {
        if (Number.isNaN(bytes)) {
            throw new Error(`fmt_filesize(): argument 'bytes': given number is NaN`);
        }
    }
    
    const multiplier = use_binary_units ? 1024 : 1000;
    const suffix = long_units ? "bytes" : "B";

    let arr = _filesize_prefixes;
    arr = use_binary_units ? arr.binary : arr.si;
    arr = long_units ? arr.long : arr.short;

    // corner cases
    if (bytes === 1) return `1 ${long_units ? "byte" : "B"}`;
    if (bytes < multiplier) return `${bytes} ${suffix}`;

    let s = bytes / multiplier;

    for (let unit of arr) {
        if (s < multiplier) {
            const rounded = s.toFixed(decimal_places);
            return `${rounded} ${unit}${suffix}`;
        }
        s /= multiplier;
    }

    // so big! (ehm: numbers are f64 in js?)
    return `${bytes} ${suffix}`;
}

export function human_filesize(bytes, long_units = false) {
    return fmt_filesize(bytes, { long_units });
}

export function nbsp(s) {
    return s.replaceAll(" ", "\xA0");
}

export function arraybuffer_to_readablestream(
    arraybuffer,
    chunksize = 16384,
) {
    // there is definetely better ways to do this, but
    // for now...
    return new ReadableStream({
        start(controller) {
            const len = arraybuffer.byteLength;
            for (let i = 0; i < len; i += chunksize) {
                let end = i + chunksize;
                if (end > len) {
                    end = len;
                }
                const chunk = arraybuffer.slice(i, end);
                controller.enqueue(chunk);
            }
            controller.close();
        }
    });
}

export async function readablestream_to_blob(stream) {
    const reader = stream.getReader();
    const chunks = [];
    let done = false;
    while (!done) {
        const next = await reader.read();
        done = next.done;
        if (next.value) {
            chunks.push(next.value);
        }
    }
    return new Blob(chunks);
}

// in: ArrayBuffer
// out: Blob (gzipped)
export async function gzip(buffer) {
    if (buffer instanceof Uint8Array) {
        buffer = buffer.buffer;
    }

    if (buffer.constructor !== ArrayBuffer) {
        const t = buffer.constructor.name;
        const msg = `buffer must be ArrayBuffer, not ${t}`;
        throw new TypeError(msg);
    }

    const stream = arraybuffer_to_readablestream(buffer);
    const gzipped_stream = stream.pipeThrough(
        new CompressionStream("gzip")
    );
    const gzipped_blob = await readablestream_to_blob(gzipped_stream);
    return gzipped_blob;
}

// decompress gzipped data
//   arg 'obj': Blob | ArrayBuffer | Uint8Array 
//   returns: ArrayBuffer
export async function gunzip(obj) {
    let stream;

    if (obj === undefined || obj == null) {
        throw new TypeError(`gunzip(): 'obj' must be a Blob or ArrayBuffer, got ${type(obj)}`);
    } else if (obj instanceof Blob) {
        stream = obj.stream();
    } else if (obj.constructor === ArrayBuffer) {
        stream = arraybuffer_to_readablestream(obj);
    } else if (obj.constructor === Uint8Array) {
        stream = arraybuffer_to_readablestream(obj.buffer);
    } else {
        const msg = "gunzip(): argument 'obj': must be a Blob or ArrayBuffer"
            + `, not ${type(obj)}`;
        throw new Error(msg);
    }

    const gunzipped_stream = stream
            .pipeThrough(new DecompressionStream("gzip"));
    const gunzipped_blob = await readablestream_to_blob(
        gunzipped_stream);
    const buffer = await gunzipped_blob.arrayBuffer();
    return buffer;
}

const _throw = Symbol("throw");
export function min(iterable, opts = {}) {
    // we could special-case the array, on the hypothesis that
    // it's faster to loop over it natively, than doing
    // through an iterator, but for now we're not
    const it = iter_or_throw(iterable, `min(): invalid argument ${iterable}`);

    const first = it.next();
    if (first.done) {
        if (Object.hasOwn(opts, "default")) {
            return opts.default;
        } else {
            throw new Error("min(): argument 'iterable': empty iterable");
        }
    }

    let keyfn;
    if (!Object.hasOwn(opts, "key")) {
        keyfn = x => x;
    } else {
        const t = typeof opts.key;
        if (t === "string" || t === "number") {
            keyfn = x => x[opts.key];
        } else if (t === "function") {
            keyfn = opts.key;
        } else {
            throw new TypeError(`min(): argument 'opts.key': must be a string, number or a function, not ${t}`);
        }
    }

    let winner = first.value;
    let winning_value = keyfn(winner);
    let done = false;
    while (true) {
        const { done, value } = it.next();
        if (done) break;

        let current_value;
        try {
            current_value = Number(keyfn(value));
        } catch (e) {
            throw new Error(`min(): error on computing the key of value '${value}'`, { cause: e });
        }
        if (Number.isNaN(current_value)) {
            throw new Error("min(): key was NaN");
        };
        
        if (current_value < winning_value) {
            winner = value;
            winning_value = current_value;
        }
    }
    return winner;
}

export function clamp(value, min, max) {
    if (typeof value === "number") {
        if (Number.isNaN(value)) {
            throw new Error("clamp(): argument 'value': cannot be NaN");
        }
    } else {
        throw new TypeError("clamp(): argument 'value': must be a number");
    }

    if (typeof min === "number") {
        if (Number.isNaN(min)) {
            throw new Error("clamp(): argument 'min': cannot be NaN");
        }
    } else {
        throw new TypeError("clamp(): argument 'min': must be a number");
    }

    if (typeof max === "number") {
        if (Number.isNaN(max)) {
            throw new Error("clamp(): argument 'max': cannot be NaN");
        }
    } else {
        throw new TypeError("clamp(): argument 'max': must be a number");
    }

    return Math.max(min, Math.min(max, value));
}

export function type(obj) {
    if (obj === undefined) return "undefined";
    if (obj === null) return "null";
    return obj.constructor.name;
}

export function iter(obj) {
    if (typeof obj === "undefined") {
        throw new TypeError("iter(): undefined is not iterable");
    }
    if (obj === null) {
        throw new TypeError("iter(): null is not iterable");
    }
    if (typeof obj === "boolean") {
        throw new TypeError("iter(): boolean is not iterable");
    }

    if (obj && typeof obj.next === "function") {
        // an object is an iterator if it has a next() method, and the next()
        // method returns a { done, value } object - but we can't really call
        // it to check, because that would advance the iterator.. so we just
        // assume the object is an iterator if it has a next() method
        return obj;
    }

    const it = obj[Symbol.iterator];
    if (typeof it === "function") {
        return it.call(obj);
    }

    if (is_pojo(obj)) {
        return object_iter(obj);
    }

    throw new TypeError("iter(): don't know how to make an iterator out of that");
}

function is_pojo(obj) {
    return !!obj && obj.constructor === Object;
}

function *object_iter(obj) {
    for (let key in obj) {
        if (Object.hasOwn(obj, key)) {
            yield [key, obj[key]];
        }
    }
}

function iter_or_throw(object, msg) {
    let it;
    try {
        it = iter(object);
    } catch (e) {
        throw new TypeError(`${msg} ('${type(object)}' is not iterable). [${e}]`);
    }
    return it;
}
