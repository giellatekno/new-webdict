export function click_outside(element, fn) {
    function on_click(ev) {
        if (!ev.target.contains(element)) {
            fn();
        }
    }

    // the newly created popup will instantly trigger the click,
    // so have the first click just setup the real handler
    document.body.addEventListener(
        "click",
        function () {
            document.body.addEventListener("click", on_click);
        },
        { once: true }
    );

    return {
        update(new_fn) {
            fn = new_fn;
        },
        destroy() {
            document.body.removeEventListener("click", on_click);
        }
    };
}
