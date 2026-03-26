#!/bin/bash

# --- Configuration ---
PROJECT_NAME="yosefshoval-dev"
REGISTRY_URL="default-route-openshift-image-registry.apps.rm2.thpm.p1.openshiftapps.com"

# Re-defined as a simple list for maximum compatibility
# Format: "IMAGE_NAME:FOLDER"
SERVICES=(
    "extraction-worker:extraction_worker"
    "api-gateway:api_gateway"
    "storage-worker:storageWorker"
    "insights-dashboard:InsightsDashboard"
    "backend:backend"
    "frontend:Frontend"
)

echo "🚀 Starting Robust Build and Push process for $PROJECT_NAME..."

for SERVICE in "${SERVICES[@]}"; do
    IMAGE_NAME="${SERVICE%%:*}"
    FOLDER="${SERVICE##*:}"
    FULL_IMAGE_PATH="${REGISTRY_URL}/${PROJECT_NAME}/${IMAGE_NAME}:latest"

    echo "----------------------------------------------------"
    echo "📦 Building service: $IMAGE_NAME from folder: $FOLDER"

    # Build without attestation manifests
    docker build --provenance=false --sbom=false -t "$IMAGE_NAME" "./$FOLDER"

    if [ $? -eq 0 ]; then
        echo "✅ Build successful. Tagging as $FULL_IMAGE_PATH ..."
        docker tag "$IMAGE_NAME" "$FULL_IMAGE_PATH"
        
        echo "⬆️ Pushing to OpenShift Registry..."
        docker push "$FULL_IMAGE_PATH"
        
        if [ $? -eq 0 ]; then
            echo "✨ Done: $IMAGE_NAME is now in OpenShift!"
        else
            echo "❌ Failed to push $IMAGE_NAME"
        fi
    else
        echo "❌ Build failed for $FOLDER."
    fi
done

echo "----------------------------------------------------"
echo "🏁 Process complete!"