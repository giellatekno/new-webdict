.PHONY: clean
clean:
	python generate_meta.py --clean
	rm -rf build/

.PHONY: image
image:
	python generate_meta.py
	pnpm run build
	podman build -f Dockerfile -t new-webdict

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

