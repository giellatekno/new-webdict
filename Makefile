.PHONY: help
help:
	@echo "Available commands:"
	@echo "clean - delete build/ directory"
	@echo "image - build languages and make container image"
	@echo "export - save container image to new-webdict.tar.gz"
	@echo "upload - upload new-wedict.tar.gz to gtweb"
	@echo "run-image - run image locally"
	@echo "push-image - [NOT OPERATIONAL] push built image to container registry"
	@echo "update-app - [NOT OPERATIONAL] restart azure container app with new image"
	@echo "login-acr - [NOT OPERATIONAL] login to the azure container registry"


.PHONY: clean
clean:
	python generate_meta.py --clean
	rm -rf build/

.PHONY: image
image:
	python generate_meta.py
	pnpm run build
	podman build -f Dockerfile -t new-webdict

.PHONY: export
export:
	podman save -o new-webdict.tar new-webdict
	gzip -f new-webdict.tar

.PHONY: upload
upload:
	scp new-webdict.tar.gz gtweb.uit.no:/home/anders/new-webdict.tar.gz

.PHONY: run-image
run-image:
	podman run -p 8080:80 new-webdict

.PHONY: push-image
push-image:
	podman tag new-webdict giellateknocontainerregistry.azurecr.io/new-webdict
	podman push giellateknocontainerregistry.azurecr.io/new-webdict

.PHONY: update-app
update-app:
	az containerapp update --name new-webdict --resource-group webdict --image giellateknocontainerregistry.azurecr.io/new-webdict



# for push-image, have to login to acr
.PHONY: login-acr
login-acr:
	az acr login --name giellateknocontainerregistry
