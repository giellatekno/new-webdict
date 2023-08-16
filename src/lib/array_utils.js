import { type } from "./utils.js";

export function array_swap(array, i, j) {
    if (!Array.isArray(array)) {
        throw new TypeError(`array_swap(): argument 'array': must be an array, got a ${type(array)}`);
    }

    if (array.length === 0) {
        // can't index into 0-length array
        // -- or of course, in js, you actually can (you'll get
        // undefined). You can even set whatever index you want,
        // and the array will be filled with "empty slots"
        // (which will be diffent than the slot being filled
        // with undefined!) up until that newly set index
        // we assume this isn't somethng the user (well, I) -
        // ever - want to actually do
        throw new Error("array_swap(): argument 'array': array has length 0");
    }

    if (!Number.isInteger(i)) {
        throw new TypeError("array_swap(): argument 'i': must be an integer");
    }

    if (!Number.isInteger(j)) {
        throw new TypeError("array_swap(): argument 'j': must be an integer");
    }

    // fix indexes
    if (i < 0) {
        i += array.length;
        if (i < 0) {
            throw new Error("array_swap(): argument 'i': out of bounds");
        }
    } else {
        if (i >= array.length) {
            throw new Error("array_swap(): argument 'i': out of bounds");
        }
    }
    if (j < 0) {
        j += array.length;
        if (j < 0) {
            throw new Error("array_swap(): argument 'j': out of bounds");
        }
    } else {
        if (j >= array.length) {
            throw new Error("array_swap(): argument 'j': out of bounds");
        }
    }

    // worth it? I dunno..
    if (i === j) return;

    // actual 3 lines of code to swap to elements of an array..
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
}

export function array_swap_unchecked(array, i, j) {
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
}

export function array_sort_subslice(array, i, j, compare_fn) {
    if (!Number.isSafeInteger(i)) {
        throw new TypeError("array_sort_subslice(): argument 'i': must be integer");
    }
    if (!Number.isSafeInteger(j)) {
        throw new TypeError("array_sort_subslice(): argument 'j': must be integer");
    }

    function throw_error(arg, val) {
        const fmt = `array_sort_subslice(): argument '${i}': must be a valid index into array ([0..${array.length - 1}], not${val})`;
        throw new Error(fmt);
    }

    if (i < 0 || i >= array.length) throw_error("i", i);
    if (j < 0 || j >= array.length) throw_error("j", j);
    if (i > j) throw new Error("array_sort_subslice(): i must be < j");
    if (i == j) return;

    const temp = array.slice(i, j + 1);
    temp.sort(compare_fn);
    array.splice(i, j - i + 1, ...temp);
    console.assert(j - i + 1 === temp.length, "must remove as many items as we're adding");
}

export function array_order_in_groups(array, ...groups) {
    if (!Array.isArray(array)) {
        throw new TypeError(`array_order_in_groups(): argument 'array': must be an array, got a ${type(array)}`);
    }

    if (groups.length === 0) return;

    const n = groups.length;
    const keys = [];
    for (let i = 0; i < array.length; i++) {
        let g = groups.findIndex(fn => fn(array[i]));
        if (g === -1) {
            // if no group is found for this element, it goes at the end
            g = n;
        }

        keys.push([i, g]);
    }

    keys.sort((a, b) => a[1] - b[1]);

    const ordered_array = keys.map(([a, _]) => array[a]);
    for (let i = 0; i < array.length; i++) {
        array[i] = ordered_array[i];
    }
}
