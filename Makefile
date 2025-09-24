.PHONY: help clean dicts build image export upload run-image push-labacr update-app

help:
	@echo "Available commands:"
	@echo "bap - rebuild everything and push image to acr"
	@echo "clean - delete build/ directory"
	@echo "dicts - regenerate compiled dictionaries"
	@echo "build - really just pnpm run build"
	@echo "image - build container image"
	@echo "export - save container image to webdict.tar.gz"
	@echo "upload - upload wedict.tar.gz to gtweb"
	@echo "run-image - run image locally"
	@echo "push-labacr - push built image to gtlab container registry"
	@echo "update-app - [NOT OPERATIONAL] restart azure container app with new image"
	@echo "login-acr - login to the azure container registry"


clean:
	python generate_meta.py --clean
	rm -rf build/

dicts:
	python generate_meta.py --clean
	python generate_meta.py

build:
	pnpm run build

image:
	podman build -f Dockerfile -t webdict

run-image:
	podman run -p 8080:80 webdict

push-labacr:
	podman tag webdict gtlabcontainerregistry.azurecr.io/webdict
	podman push gtlabcontainerregistry.azurecr.io/webdict

bap:
	python generate_meta.py --clean
	rm -rf build/
	python generate_meta.py
	pnpm run build
	podman build -f Dockerfile -t webdict
	podman tag webdict gtlabcontainerregistry.azurecr.io/webdict
	podman push gtlabcontainerregistry.azurecr.io/webdict


update-app:
	az containerapp update --name webdict --resource-group webdict --image giellateknocontainerregistry.azurecr.io/webdict



# for push-image, have to login to acr
.PHONY: login-acr
login-acr:
	az acr login --name giellateknocontainerregistry
