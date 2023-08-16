<script>
    import { tweened } from "svelte/motion";
    import { quintOut } from "svelte/easing";

    export let open = false;

    const opts = { duration: 350, easing: quintOut };
    let Y1 = tweened(open ? 70 : 35, opts);
    let Y2 = tweened(open ? 35 : 70, opts);

    $: $Y1 = open ? 70 : 35;
    $: $Y2 = open ? 35 : 70;

    function flip() { open = !open; }
</script>

<span on:click={flip} on:keypress={flip}>
    <svg height="22" width="22" viewbox="0 0 100 100">
        <line x1="0" y1="{$Y1}" x2="50" y2="{$Y2}" stroke="black" stroke-width="7.5" />
        <line x1="50" y1="{$Y2}" x2="100" y2="{$Y1}" stroke="black" stroke-width="7.5" />
    </svg>
</span>

<style>
    span {
        display: inline-flex;
        height: 26px;
        width: 26px;
        align-items: center;
        justify-content: center;
    }

    span:hover {
        background: radial-gradient(circle at center, #eee 0, #eee 90%, #fff 90%);
        background-size: 100%;
    }

    svg {
        cursor: pointer;
    }

    svg:hover {
    }
</style>
