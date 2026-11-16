#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -lt 1 ]]; then
  echo "Использование: bash scripts/build-fedora.sh IP_СЕРВЕРА [ПОРТ_API]" >&2
  exit 1
fi
for program in node npm cargo rustc pkg-config python3; do
  command -v "$program" >/dev/null || { echo "Не найдена команда: $program. См. README_NATIVE.md" >&2; exit 1; }
done
pkg-config --exists webkit2gtk-4.1 || { echo 'Установите webkit2gtk4.1-devel (см. README_NATIVE.md)' >&2; exit 1; }
# The app runs on WASM CPU. No NVIDIA/CUDA download is needed for npm dependencies.
export ONNXRUNTIME_NODE_INSTALL_CUDA=skip
npm ci
npm run native:configure -- "$@"
npm run models:download
npm run tauri build -- --bundles rpm
echo 'Исполняемый файл: src-tauri/target/release/cloud-tariffs-native'
echo 'Установочный пакет: src-tauri/target/release/bundle/rpm/'
