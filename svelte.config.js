import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
        alias: {
            "$lib": "src/lib",
            "$assets": "src/assets",
            "$tries": "src/tries/",
            "$components": "src/lib/components",
        },
		adapter: adapter(),
	}
};

export default config;
