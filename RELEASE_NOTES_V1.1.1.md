# SheetApp v1.1.1 - Low-Spec PC Fix (4GB RAM)

**Hotfix release** resolving blank white screen on low-specification computers (2–4 GB RAM, integrated graphics).

### 🐛 Bug Fixed

**Blank white window on startup** — On slow/low-spec machines, the Electron window was loading before the Express backend server had finished starting, resulting in a blank white screen. The app title was visible but no content loaded.

### ✅ What Changed

| Fix | Details |
|---|---|
| **Backend readiness polling** | App now retries `GET /api/status` up to 30 times (every 500ms = 15 sec timeout) before loading the UI |
| **Animated loading screen** | A dark-themed spinner screen is shown immediately on launch while the backend warms up — no more blank white screen |
| **Error fallback screen** | If the backend fails to start after 15 seconds, a friendly error message is shown |
| **`--disable-dev-shm-usage`** | Critical fix for low-RAM machines — prevents Chromium shared memory exhaustion |
| **`--single-process`** | Reduces total memory footprint by running renderer in the main process |
| **`--disable-gpu-compositing`** | Fixes rendering on integrated Intel/AMD graphics without discrete GPU |
| **V8 `--optimize-for-size`** | Instructs the JavaScript engine to minimize memory use over raw speed |
| **Second-instance focus** | Clicking the app a second time now focuses the existing window instead of opening a blank second one |

### 📦 Download Windows Desktop Packages

| Asset | Type | Description |
|---|---|---|
| 💾 **SheetApp-1.1.1-Windows-x64.exe** | NSIS Setup Installer | Full installer with Start Menu & Desktop shortcuts |
| 🚀 **SheetApp-1.1.1-Portable-x64.exe** | Standalone Portable | No installation needed — run directly |

---
**Engineering by Mahima Paseda** · [www.mahimapaseda.lk](https://www.mahimapaseda.lk)
