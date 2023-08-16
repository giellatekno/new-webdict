<script>
    import { onDestroy } from "svelte";
    import { fly } from "svelte/transition";
    //import { click_outside } from "$lib/click_outside.js";
    export let open = false;

    const fly_opts = { y: -15, duration: 70 };
    let main_el;

    function flip() { open = !open; }

    function on_click(ev) {
        if (!open) return;
        ev.preventDefault();
        if (!ev.target.contains(main_el)) {
            console.log("click inside");
        } else {
            console.log("click outside");
            open = false;
        }
    }

    function on_first_click() {
        window.addEventListener("click", on_click, { once: true });
    }

    onDestroy(() => {
        window.removeEventListener("click", on_click);
    });
</script>

<svelte:window on:click={on_first_click}></svelte:window>

<main bind:this={main_el}>
    <div class="content" on:click={flip} on:keydown={flip}>
        <slot name="content" />
    </div>

    {#if open}
        <div
            class="popup"
            transition:fly={fly_opts}
        >
            <slot name="popup" />
        </div>
    {/if}
</main>

<style>
    main {
        position: relative;
    }

    div.popup {
        position: absolute;
    }
</style>
