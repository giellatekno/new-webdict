<script>
    import { tweened } from "svelte/motion";
    import { clamp } from "$lib/utils.js";
    export let value = 0;
    export let max = 100;

    $: ratio = clamp(value / max, 0.0, 1.0);
    const pct = tweened(ratio);
    $: pct.set(ratio * 100);
</script>

<main>
    <div class="inner"
        style="min-width: {$pct}%; width: {$pct}%;">
    </div>
</main>

<style>
    main {
        display: flex;
        align-items: center;
        background-color: #deecfb;
        border-radius: 2px;
        width: 100%;
        height: 8px;
        box-sizing: border-box;
    }

    .inner {
        background-color: blue;
        border-radius: 2px;
        height: 8px;
    }
</style>
