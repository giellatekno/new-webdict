<script>
    /* THIS FILE IS NOT USED */
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
    import { tweened } from "svelte/motion";
    import { quintOut } from "svelte/easing";

    export let can_switch = false;
    export let direction = "right";

    $: color = can_switch ? "rgb(0, 0, 255)" : "black";

    const opts = { duration: 350, easing: quintOut };
    let X1 = tweened(direction === "right" ? 65 : 35, opts);
    let X2 = tweened(direction === "right" ? 98 : 2, opts);

    const width = "6";

    const show_border = false;
    $: $X1 = direction === "right" ? 65 : 35;
    $: $X2 = direction === "right" ? 98 : 2;
</script>

<svg
    style:cursor={can_switch ? "pointer" : "default"}
    on:click
    on:keydown
    role="button"
    tabindex="0"
    viewBox="0 0 100 50" width="36" height="36"
>
    {#if show_border}
        <rect x="0" y="0" width="100" height="50"
              stroke="red" fill="none" />
    {/if}

    <line x1="0" y1="25" x2="99" y2="25"
        stroke-width={width} stroke={color} />

    <line x1={$X1} y1="0" x2={$X2} y2="25"
          stroke-width={width} stroke={color} />
    <line x1={$X1} y1="50" x2={$X2} y2="25"
        stroke-width={width} stroke={color} />
</svg>
