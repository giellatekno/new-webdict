import { sveltekit } from "@sveltejs/kit/vite";
import precompile_intl from "svelte-intl-precompile/sveltekit-plugin";

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
        sveltekit(),
        precompile_intl("src/locales"),
    ]
};

export default config;
