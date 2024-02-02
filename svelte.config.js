import adapter from '@sveltejs/adapter-static';

const dev = process.env.NODE_ENV == "development";
const prod = process.env.NODE_ENV == "production";

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
		adapter: adapter(),
	}
};

export default config;
