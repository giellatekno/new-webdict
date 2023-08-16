// load a trie from a buffer by converting it to a string,
// then xmlparsing that string to an xml object
export function load_trie(buffer) {
    const string = new TextDecoder().decode(buffer);
    console.log("load_trie(): string starts with:");
    console.log(string.slice(0, 30));
    const doc = new DOMParser().parseFromString(string, "text/xml");
    if (doc.querySelector("parsererror")) {
        console.error("failed to parse xml! The xml data begins with:");
        console.error(string.slice(0, 30));
        throw new Error("failed to parse xml!");
    } else {
        const root = doc.childNodes[0];
        return root;
    }
}

export function *prefix_search(node, search) {
    const slen = search.length;

    for (let i = 0; i < node.childNodes.length; i++) {
        const current = node.childNodes[i];
        const v = current.getAttribute("v");
        const vlen = v.length;
        console.assert(typeof v !== "undefined");

        if (current.nodeName === "w") {
            if (vlen >= slen) {
                yield inner(current);
            }
        } else {
            const v_lower = v.toLowerCase();
            if (
                (slen < vlen && v_lower.startsWith(search))
                ||
                (slen >= vlen && search.startsWith(v_lower))
            ) {
                yield *prefix_search(current, search);
            }
        }
    }
}

// read the inner node of a node in the trie
function inner(node) {
    console.assert(!!node, "inner(): node wasn't anything");
    let left, right, pos;
    for (let i = 0; i < node.childNodes.length; i++) {
        const current = node.childNodes[i];
        if (current.nodeName === "l") {
            left = inner_text(current);
            pos = get_pos(current);
        } else if (current.nodeName === "r") {
            right = inner_text(current);
        }
    }

    return `${left}${pos} → ${right}`;
}

function get_pos(node) {
    for (let i = 0; i < node.childNodes.length; i++) {
        let current = node.childNodes[i];
        if (current.nodeName === "s") {
            const n = current.getAttribute("n");
            return ` <span class="green">${n}</span>`;
        }
    }
    return "";
}

function inner_text(node) {
    if (node === undefined) return "";
    for (let i = 0; i < node.childNodes.length; i++) {
        let current = node.childNodes[i];
        if (current.nodeType == 3) {
            return current.data;
        }
    }
}
