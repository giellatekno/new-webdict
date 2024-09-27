import adapter from '@sveltejs/adapter-static';
import * as fs from "fs";

const dev = process.env.NODE_ENV == "development";
const prod = process.env.NODE_ENV == "production";

const extra_roots = fs.readdirSync("static/tries", {})
    .map(d => [d.slice(0, 3), d.slice(4, 7)])
    .map(([l1, l2]) => `/meta-info/${l1}-${l2}`);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
        alias: {
            "$lib": "src/lib",
            "$assets": "src/assets",
            "$tries": "src/tries/",
            "$components": "src/lib/components",
        },
        paths: {
            base: dev ? "" : "/webdict",
        },
        prerender: {
            entries: [
                "*",
                ...extra_roots,
            ]
        },
		adapter: adapter(),
	}
};

export default config;
