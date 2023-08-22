export class Trie {
    constructor(opts = {}) {
        if (Object.hasOwn(opts, "root")) {
            this.root = opts.root;
        }
    }

    static from_buffer(buffer) {
        const string = new TextDecoder().decode(buffer);
        const root = JSON.parse(string);
        return new Trie({ root });
    }

    *prefix_search(prefix) {
        const node = this._find_exact_node(prefix);
        if (node !== null) {
            yield *this._prefix_search_from_node(node, prefix);
        }
    }

    _find_exact_node(key) {
        let node = this.root;
        for (let i = 0; i < key.length; i++) {
            const char = key[i];
            node = node[1][char];
            if (node === undefined) {
                return null;
            }
        }
        return node;
    }

    *_prefix_search_from_node(node, current_string) {
        if (has_data(node)) {
            for (const [pos, translations] of get_data(node)) {
                yield [current_string, pos, translations];
            }
        }

        for (let [char, child] of children(node)) {
            const next_string = current_string + char;
            yield *this._prefix_search_from_node(child, current_string + char);
        }
    }
}

function has_data(node) {
    return node[0] !== null;
}

function *get_data(node) {
    for (let [pos, translations] of node[0]) {
        yield [pos, translations];
    }
}

function children(node) {
    // ensure that we list alphabetically
    const entries = Object.entries(node[1]);
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
}
