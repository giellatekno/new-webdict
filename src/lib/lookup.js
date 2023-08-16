/* moved to lib/trie.js */

/*
export function *lookUpRecursive(parentNode, search, dir) {
    for (let i = 0; i < parentNode.childNodes.length; i++ ) {
        let node = parentNode.childNodes[i];
        if (node.nodeName === "w") {
            let v = node.getAttribute("v");
            if (v.length >= search.length) {
                let x = inner(node);
                yield x;
            }
        } else {
            let attr = node.attributes;
            console.assert(typeof attr !== "undefined");
            if (typeof attr === "undefined") {
                console.log("attr undefined");
                console.log(node);
                continue;
            }
            let v = node.getAttribute("v").toLowerCase();
            if (search.length < v.length && v.startsWith(search)) {
                yield *lookUpRecursive(node, search, dir);
            }
            if (search.length >= v.length && search.startsWith(v)) {
                yield *lookUpRecursive(node, search, dir);
            }
        }
    }
}

export function parse_xml(string) {
    let root = new DOMParser()
        .parseFromString(string, "text/xml")
        .childNodes[0];

    return root;
}

export function inner(node) {
    if (!node) return null;
    let left, right, pos;

    for (let i = 0; i < node.childNodes.length; i++) {
        let sNode = node.childNodes[i];
        if (sNode.nodeName == "l") {
            left = inner_text(sNode);
            pos = get_pos(sNode);
        } else if (sNode.nodeName == "r") {
            right = inner_text(sNode);
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

export function inner_text(node) {
    if (node === undefined) return "";
    for (let i = 0; i < node.childNodes.length; i++) {
        let current = node.childNodes[i];
        if (current.nodeType == 3) {
            return current.data;
        }
    }
}
*/
