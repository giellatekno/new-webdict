.PHONY: help
help:
	@echo "Available commands:"
	@echo "clean - delete build/ directory"
	@echo "image - build languages and make container image"
	@echo "export - save container image to webdict.tar.gz"
	@echo "upload - upload wedict.tar.gz to gtweb"
	@echo "run-image - run image locally"
	@echo "push-labacr - push built image to gtlab container registry"
	@echo "update-app - [NOT OPERATIONAL] restart azure container app with new image"
	@echo "login-acr - login to the azure container registry"


.PHONY: clean
clean:
	python generate_meta.py --clean
	rm -rf build/

.PHONY: image
image:
	python generate_meta.py
	pnpm run build
	podman build -f Dockerfile -t webdict

.PHONY: export
export:
	podman save -o webdict.tar webdict
	gzip -f webdict.tar

.PHONY: upload
upload:
	scp webdict.tar.gz gtweb.uit.no:/home/anders/webdict.tar.gz

.PHONY: run-image
run-image:
	podman run -p 8080:80 webdict

.PHONY: push-image
push-labacr:
	podman tag webdict gtlabcontainerregistry.azurecr.io/webdict
	podman push gtlabcontainerregistry.azurecr.io/webdict

.PHONY: update-app
update-app:
	az containerapp update --name webdict --resource-group webdict --image giellateknocontainerregistry.azurecr.io/webdict



# for push-image, have to login to acr
.PHONY: login-acr
login-acr:
	az acr login --name giellateknocontainerregistry
