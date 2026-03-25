#!/bin/bash

# --- הגדרות משתנים (תעדכן לפי מה שקיבלת מהסוכן/קונסול) ---
# הכתובת של ה-Registry ב-Sandbox בדרך כלל נראית כך:
REGISTRY_URL="default-route-openshift-image-registry.apps.sandbox.x86_64.abc.p1.openshiftapps.com"
PROJECT_NAME="yosefshoval-dev" # שם ה-Namespace שלך ב-Sandbox

# רשימת השירותים שדורשים Build מה-docker-compose.yml
# המפתח הוא שם התיקייה, הערך הוא שם האימג' שנרצה ב-OpenShift
declare -A SERVICES
SERVICES=(
    ["extraction_worker"]="extraction-worker"
    ["api_gateway"]="api-gateway"
    ["storageWorker"]="storage-worker"
    ["InsightsDashboard"]="insights-dashboard"
    ["backend"]="backend"
    ["Frontend"]="frontend"
)

echo "🚀 Starting Build and Push process for $PROJECT_NAME..."

for FOLDER in "${!SERVICES[@]}"; do
    IMAGE_NAME=${SERVICES[$FOLDER]}
    FULL_IMAGE_PATH="$REGISTRY_URL/$PROJECT_NAME/$IMAGE_NAME:latest"

    echo "----------------------------------------------------"
    echo "📦 Building service: $IMAGE_NAME from folder: $FOLDER"
    
    # בניית האימג'
    docker build -t "$IMAGE_NAME" "./$FOLDER"

    if [ $? -eq 0 ]; then
        echo "✅ Build successful. Tagging..."
        
        # תיוג עבור ה-Registry של OpenShift
        docker tag "$IMAGE_NAME" "$FULL_IMAGE_PATH"
        
        echo "⬆️ Pushing to OpenShift Registry..."
        docker push "$FULL_IMAGE_PATH"
        
        if [ $? -eq 0 ]; then
            echo "✨ Done: $IMAGE_NAME is now in OpenShift!"
        else
            echo "❌ Failed to push $IMAGE_NAME"
        fi
    else
        echo "❌ Build failed for $FOLDER. Skipping..."
    fi
done

echo "----------------------------------------------------"
echo "🏁 Process complete!"