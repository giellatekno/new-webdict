/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

import { build, files, version } from "$service-worker";

const CACHE = `cache-${version}`;

async function install() {
    const cache = await caches.open(CACHE);
    await cache.addAll(build);

    console.log(`new service worker installed (${CACHE})`);
}

async function activate() {
    // delete old caches
    for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
    }

    console.log("service worker activated");
}

// all fetch() calls from the site goes through this
async function proxy_fetch(request) {
    const url = new URL(request.url);
    const cache = await caches.open(CACHE);

    const match = await cache.match(url.pathname);
    if (match) {
        return match;
    }

    return await fetch(request);
}

sw.addEventListener("install", event => event.waitUntil(install()));
sw.addEventListener("activate", event => event.waitUntil(activate()));
sw.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET") return;

    event.respondWith(proxy_fetch(request))
});
