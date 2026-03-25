#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  Scanalytics — OpenShift Deployment Script
#  Deploys in correct dependency order with readiness gates.
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail
alias oc="/c/oc/oc.exe"

NAMESPACE="yosefshoval-dev"
REGISTRY="image-registry.openshift-image-registry.svc:5000/${NAMESPACE}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Colors ──────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }

wait_for_rollout() {
  local kind=$1 name=$2
  info "Waiting for ${kind}/${name} to be ready..."
  oc rollout status "${kind}/${name}" -n "${NAMESPACE}" --timeout=300s
  ok "${kind}/${name} is ready."
}

wait_for_pod_ready() {
  local label=$1
  info "Waiting for pods with label app=${label}..."
  oc wait pod -l "app=${label}" -n "${NAMESPACE}" \
    --for=condition=Ready --timeout=300s
  ok "Pods app=${label} are ready."
}

# ═══════════════════════════════════════════════════════════════════
#  Phase 0: Switch to project (Sandbox — namespace is pre-assigned)
# ═══════════════════════════════════════════════════════════════════
info "Phase 0 — Switching to project ${NAMESPACE}..."
oc project "${NAMESPACE}"
ok "Now using project ${NAMESPACE}."

# ═══════════════════════════════════════════════════════════════════
#  Phase 1: Secrets & ConfigMap
# ═══════════════════════════════════════════════════════════════════
info "Phase 1 — Applying Secrets & ConfigMap..."
oc apply -f "${SCRIPT_DIR}/01-secrets.yaml"
oc apply -f "${SCRIPT_DIR}/02-configmap.yaml"
ok "Secrets & ConfigMap applied."

# ═══════════════════════════════════════════════════════════════════
#  Phase 2: Build & Push Images
#  (Skip if images already exist in the registry)
# ═══════════════════════════════════════════════════════════════════
info "Phase 2 — Building and pushing application images..."

SERVICES=(
  "extraction-worker:extraction_worker"
  "api-gateway:api_gateway"
  "storage-worker:storageWorker"
  "insights-dashboard:InsightsDashboard"
  "backend:backend"
  "frontend:Frontend"
)

for entry in "${SERVICES[@]}"; do
  IMAGE_NAME="${entry%%:*}"
  BUILD_DIR="${entry##*:}"
  info "Building ${IMAGE_NAME} from ${BUILD_DIR}/..."

  # Use OpenShift BuildConfig or local docker/podman build + push
  if command -v podman &>/dev/null; then
    podman build -t "${REGISTRY}/${IMAGE_NAME}:latest" \
      -f "${SCRIPT_DIR}/../${BUILD_DIR}/Dockerfile" \
      "${SCRIPT_DIR}/../${BUILD_DIR}"
    podman push "${REGISTRY}/${IMAGE_NAME}:latest"
  elif command -v docker &>/dev/null; then
    docker build -t "${REGISTRY}/${IMAGE_NAME}:latest" \
      -f "${SCRIPT_DIR}/../${BUILD_DIR}/Dockerfile" \
      "${SCRIPT_DIR}/../${BUILD_DIR}"
    docker push "${REGISTRY}/${IMAGE_NAME}:latest"
  else
    warn "Neither podman nor docker found. Skipping image build."
    warn "Make sure images are available in the registry."
    break
  fi
  ok "Image ${IMAGE_NAME} pushed."
done

# ═══════════════════════════════════════════════════════════════════
#  Phase 3: Data Layer (Kafka, MongoDB, Elasticsearch)
# ═══════════════════════════════════════════════════════════════════
info "Phase 3 — Deploying data layer..."
oc apply -f "${SCRIPT_DIR}/kafka/statefulset.yaml"
oc apply -f "${SCRIPT_DIR}/mongodb/statefulset.yaml"
oc apply -f "${SCRIPT_DIR}/elasticsearch/statefulset.yaml"

wait_for_pod_ready "kafka"
wait_for_pod_ready "mongodb"
wait_for_pod_ready "elasticsearch"

# ═══════════════════════════════════════════════════════════════════
#  Phase 4: Kafka Topic Init & Infrastructure UIs
# ═══════════════════════════════════════════════════════════════════
info "Phase 4 — Creating Kafka topics & deploying infrastructure UIs..."
oc apply -f "${SCRIPT_DIR}/kafka/init-job.yaml"
oc apply -f "${SCRIPT_DIR}/kafka/kafka-ui.yaml"
oc apply -f "${SCRIPT_DIR}/elasticsearch/kibana.yaml"

# Wait for topic-init job to complete
info "Waiting for kafka-init-topics job..."
oc wait job/kafka-init-topics -n "${NAMESPACE}" \
  --for=condition=Complete --timeout=120s
ok "Kafka topics created."

# ═══════════════════════════════════════════════════════════════════
#  Phase 5: Workers (consumer-only, no routes)
# ═══════════════════════════════════════════════════════════════════
info "Phase 5 — Deploying workers..."
oc apply -f "${SCRIPT_DIR}/extraction-worker/deployment.yaml"
oc apply -f "${SCRIPT_DIR}/storage-worker/deployment.yaml"

wait_for_rollout "deployment" "extraction-worker"
wait_for_rollout "deployment" "storage-worker"

# ═══════════════════════════════════════════════════════════════════
#  Phase 6: API Services
# ═══════════════════════════════════════════════════════════════════
info "Phase 6 — Deploying API services..."
oc apply -f "${SCRIPT_DIR}/api-gateway/deployment.yaml"
oc apply -f "${SCRIPT_DIR}/backend/deployment.yaml"
oc apply -f "${SCRIPT_DIR}/insights-dashboard/deployment.yaml"

wait_for_rollout "deployment" "api-gateway"
wait_for_rollout "deployment" "backend"
wait_for_rollout "deployment" "insights-dashboard"

# ═══════════════════════════════════════════════════════════════════
#  Phase 7: Frontend
# ═══════════════════════════════════════════════════════════════════
info "Phase 7 — Deploying frontend..."
oc apply -f "${SCRIPT_DIR}/frontend/deployment.yaml"
wait_for_rollout "deployment" "frontend"

# ═══════════════════════════════════════════════════════════════════
#  Phase 8: Print Route URLs
# ═══════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
ok "Deployment complete! 🎉"
echo "═══════════════════════════════════════════════════════════════"
echo ""
info "Application Routes:"
echo ""
oc get routes -n "${NAMESPACE}" -o custom-columns=\
'NAME:.metadata.name,HOST:.spec.host,TLS:.spec.tls.termination' \
  --no-headers | while read -r name host tls; do
  echo -e "  ${GREEN}${name}${NC} → https://${host}"
done
echo ""
warn "Remember to update ConfigMap VITE_* URLs with the actual Route hostnames above!"
warn "Then restart the frontend deployment:  oc rollout restart deployment/frontend -n ${NAMESPACE}"
