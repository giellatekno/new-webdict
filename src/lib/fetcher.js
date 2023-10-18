//import { beforeNavigate } from "$app/navigation";
import { navigating } from "$app/stores";
import { gunzip } from "$lib/utils.js";
import { debug } from "$lib/debug_console.js";

function noop() {}

export function download(
    url,
    {
        on_start = noop,
        on_progress = noop,
        on_fail = noop,
        on_abort = noop,
        decompressed_size = null,
    } = {}
) {
    const controller = new AbortController();
    const signal = controller.signal;
    let unsubscribe;

    function abort_download() {
        console.log("download(): navigating! abort download!");

        if (signal && signal.abort) {
            signal.abort();
        }

        if (unsubscribe) {
            console.log("unsubscribing from navigating store");
            unsubscribe();
        }
    }

    unsubscribe = navigating.subscribe(navigation => {
        if (navigation) {
            abort_download();
        }
    });

    const data = _download(
        url,
        signal,
        on_start,
        on_progress,
        on_fail,
        on_abort,
        decompressed_size,
    );

    return { signal, data };
}

async function _download(
    url,
    signal,
    on_start,
    on_progress,
    on_fail,
    on_abort,
    decompressed_size,
) {
    let response;

    debug("_download(): awaiting fetch()...");
    try {
        response = await fetch(url, { signal });
    } catch (e) {
        // can't connect - server down, or no internet
        console.error(`download(): fetch() failed: ${e}`);
        debug(`_download(): fetch() failed: ${e}`);
        on_fail(e);
        throw new Error("download failed");
        return;
    }

    debug("_download(): done awaiting fetch()");

    // todo: is this enough to determine if we have
    // actually have data?
    if (response.status !== 200) {
        let resp = response.status;
        console.error(`download(): non-200 response: ${resp}`);
        on_fail("non-200");
        return;
    }

    const content_encoding = response.headers.get("content-encoding");
    // the browser will auto-gunzip if the "Content-Encoding: gzip" header is present
    const auto_gzipped = content_encoding && content_encoding.toLowerCase() === "gzip";

    if (decompressed_size !== null) {
        const content_length = response.headers.get("content-length");
        on_start(content_length);
    }

    const chunks = [];
    let size = 0;

    debug("about to await for response.body...");
	const reader = response.body.getReader();
	while (true) {
		const { value: chunk, done } = await reader.read();
		if (done) {
			debug("done reading response body. break!");
			break;
		}
        debug(`new chunk, length=${chunk.length}`);
		chunks.push(chunk);
		size += chunk.length;
		on_progress(chunk);
	}
	/*
	// Chrome on mobile just freezes here! (other mobile browser untested)
    for await (const chunk of response.body) {
        debug(`new chunk, length=${chunk.length}`);
        chunks.push(chunk);
        size += chunk.length;
        on_progress(chunk);
    }
	*/

    const buffer = new Uint8Array(size);

    let offset = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }

    if (!auto_gzipped) {
        debug("await gunzip(buffer)...");
        return await gunzip(buffer);
    } else {
        return buffer;
    }
}
