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
        background-color: rgb(220, 220, 230);
        border: 1px solid #aaaaaa; 
        width: 100%;
        height: 28px;
        padding: 8px 6px;
        border-radius: 22px;
        box-sizing: border-box;
    }

    .inner {
        border-radius: 22px;
        height: 18px;
        background-color: rgb(0, 0, 255);
    }
</style>
