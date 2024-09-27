# webdict

A rewrite of Giellatekno Webdict, using the same underlying algorithm and 
data, but using SvelteKit, and served on Azure.

## Running

Install node dependencies using `pnpm i`, and make the gzipped trie files
from the originals using `python3 generate_metas.py`. Use `gut` to update
the dictionaries.

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

```bash
make image
make push-labacr
# if this fails, login as follows:
podman login gtlabcontainerregistry.azurecr.io
ssh gtweb-02.uit.no
sudo su - services
tjeneste webdict pull
sudo tjeneste webdict restart
```

To run a preview of the image locally, do `make run-image`.
