# webdict

A rewrite of Giellatekno Webdict, using the same underlying algorithm and 
data, but using SvelteKit, and served on Azure.

## Running

Install node dependencies using `pnpm i`, and make the gzipped trie files
from the originals using `python3 generate_metas.py`.

The `xmllint` program is in package `libxml2-utils` on Debian/Ubuntu.

```bash
pnpm i
python3 generate_metas.py
```


## Developing

Run the development server as usual with `npm` or `pnpm`.

```bash
pnpm run dev
```

To do development on the development-vm (to easily be able to test on a phone),
do...

## Deployment

To create the deployment image, do `make image`, followed by `make push-image`.
If all goes well, the newly built image will be up and running on the url in
a couple of minutes.

To run a preview of the image locally, do `make run-image`.
