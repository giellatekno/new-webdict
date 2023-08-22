import json


class TrieNode:
    def __init__(self, data=None, parent=None):
        self.children = {}
        self.data = data
        self.parent = parent

    def into_json(self):
        return json.dumps(self.into_obj())

    def into_obj(self):
        return [self.data, {char: node.into_obj() for char, node in self.children.items()}]


class Trie:
    def __init__(self):
        self.root = TrieNode(parent=None)
        self._len = 0

    def into_json(self):
        return self.root.into_json()

    def insert(self, string, data):
        self._len += 1
        node = self.root
        for char in string:
            node = node.children.setdefault(char, TrieNode(parent=node))
        node.data = data

    def prefix_search(self, prefix):
        node = self._find_exact_node(prefix)
        if node.data is not None:
            yield prefix, node.data

        yield from self._prefix_search_from_node(node, prefix)

    def _prefix_search_from_node(self, node, current_string):
        for char, child_node in node.children.items():
            new_string = current_string + char
            if child_node.data:
                yield new_string, child_node.data
            yield from self._prefix_search_from_node(child_node, new_string)

    def _find_exact_node(self, key):
        node = self.root
        for char in key:
            node = node.children.get(char)
            if node is None:
                return None
        return node

    def find_exact(self, search):
        return self._find_exact_node(search).data

    def __len__(self):
        return self._len
