export class IDB {
    constructor(spec) {
        if (typeof window === "undefined") {
            // sveltekit runs this on the server
            return;
        }

        this.spec = spec;
        this.queue = [];

        this.database = new Promise((resolve, reject) => {
            const req = window.indexedDB.open(
                this.spec.name, this.spec.version);
            req.onupgradeneeded = ev => {
                console.log("upgradeneeded");
                const db = ev.target.result;

                const stores = Object.entries(this.spec.stores);
                for (const [ name, { keyPath } ] of stores) {
                    db.createObjectStore(name, { keyPath });
                }
            };
            req.onsuccess = _ => {
                resolve(req.result);
            };
            req.onerror = ev => {
                const error = ev.target.error;
                console.error("db error", error);
                reject(error);
            };
        });
    }

    transaction(object_stores, mode, fn) {
        if (!Array.isArray(object_stores)) {
            object_stores = [object_stores];
        }

        for (const name of object_stores) {
            if (!Object.hasOwn(this.spec.stores, name)) {
                throw new Error(`database has no object store named "${name}"`);
            }
        }

        return this.database.then(db => {
            return new Promise((resolve, reject) => {
                let tr;
                try {
                    tr = db.transaction(object_stores, mode);
                } catch (e) {
                    const j = object_stores.join(", ");
                    const msg = `can't start "${mode}" ` +
                        `transaction on ${j}`;
                    console.log(msg);
                    throw e;
                }

                let result;
                tr.oncomplete = ev => {
                    // this fires whenever an object store
                    // cursor completes, and we can have many
                    // cursors or other operations running
                    // in a "transaction" - so we don't want to
                    // resolve() here - we will do it after
                    // the callback resolves, later down
                };
                tr.onerror = ev => reject(ev.target.error);

                const wrapped_object_stores = object_stores.map(
                    s => new ObjectStore(tr.objectStore(s)));

                // it commits automatically, we don't need
                // to consern ourselves with that.. I think
                fn(wrapped_object_stores).then(resolve);
            });
        });
    }

    delete_database() {
        return this.database
            // db.close() returns immediately, and doesn't
            // actually close the db before all running
            // transactions are complete, so this is wrong
            .then(db => db.close())
            // to prevent further use
            .then(() => this.database = null)
            .then(() => _delete_database(this.spec.name));
    }
}

class ObjectStore {
    constructor(object_store) {
        // TODO maybe assert that it's actually an ObjectStore
        this._store = object_store;
    }

    get store() { return this._store; }
    get name() { return this._store.name; }

    // add an object to this store
    add(object, key) {
        return new Promise((resolve, reject) => {
            const request = this._store.add(object, key);
            request.onsuccess = ev => resolve();
            request.onerror = ev => reject(ev.target.error);
        });
    }

    delete(key) {
        return new Promise((resolve, reject) => {
            const request = this._store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = ev => reject(ev.target);
        });
    }

    // gets the one value, or throws an error if
    // there is not exactly one object for that key
    get_one(key) {
        return new Promise((resolve, reject) => {
            let got_value = false;
            let value;
            const request = this._store.openCursor(key);
            request.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) {
                    if (got_value) {
                        reject("got more than 1 value");
                    } else {
                        got_value = true;
                        value = cursor.value;
                        cursor.continue();
                    }
                } else {
                    if (got_value) {
                        resolve(value);
                    } else {
                        reject("key not found");
                    }
                }
            };
        });
    }

    get_all(key) {
        return new Promise((resolve, reject) => {
            const results = [];
            const cursor_request = this._store
                .openCursor(key);
            cursor_request.onsuccess = ev => {
                const cursor = ev.target.result;
                if (cursor) {
                    results.push([cursor.key, cursor.value]);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
        });
    }

    async get_all_objects(key) {
        const entries = await this.get_all(key);
        return entries.map(([key, object]) => object);
    }

    // the "default" get() - just gets the first (randomly)
    async get_first(key) {
        throw new Error("unimplemented");
    }
}

function _delete_database(name) {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB
            .deleteDatabase(name);
        console.log("request sent to delete database..");
        request.onsuccess = ev => {
            console.log("database deleted");
            resolve();
        };
        request.onerror = ev => {
            console.log("error deleting database");
            reject(ev.target.error);
        };
    });
}
