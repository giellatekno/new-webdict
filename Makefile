
.PHONY: image
image:
	pnpm run build
	podman build -f Dockerfile -t new-webdict

.PHONY: run-image
run-image:
	podman run -p 8080:80 new-webdict

.PHONY: push-image
push-image:
	podman tag new-webdict giellateknocontainerregistry.azurecr.io/new-webdict
	podman push giellateknocontainerregistry.azurecr.io/new-webdict


#
# After pushing a new image, we need to run this command to make the new
# image the running one
#az containerapp update \
  --name <APPLICATION_NAME> \
  --resource-group <RESOURCE_GROUP_NAME> \
  --image <IMAGE_NAME>

