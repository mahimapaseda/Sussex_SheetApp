# SheetApp v1.2.0 - Low-Spec Windows Desktop Release

Complete Windows desktop release for **SheetApp**, engineered with the proven embedded architecture of **WishSync** for optimal performance on low-specification computers (2–4 GB RAM, integrated graphics).

### 🐛 Fixed in v1.2.0

1. **Embedded Express Port Binding:**
   - In earlier builds, the server start call was wrapped inside an entrypoint condition (`if (require.main === module)`), which prevented the Express server from listening on port 3850 when required inside Electron. The server now binds automatically upon startup.
2. **User Data & Permissions Isolation:**
   - User data (`settings.json`, `sent_log.json`, attached flyer assets, and `.wwebjs_auth` session caches) now reside in `%APPDATA%\SheetApp` with automatic initial migration. This prevents `EPERM` / read-only filesystem errors when installed under `Program Files`.
3. **Execution Level Privileges:**
   - Configured `requestedExecutionLevel: "asInvoker"` so the executable runs under standard user permissions without triggering administrative blocks on school or office computers.
4. **Optimized Memory & Resource Flags:**
   - Tuned low-memory flags: `--disable-gpu`, `--disable-software-rasterizer`, `--disable-background-networking`, `--disable-extensions`, `--renderer-process-limit=1`, and V8 `--max-old-space-size=128 --optimize-for-size`.
5. **System Tray & Clean Shutdown:**
   - Added system tray icon with quick actions and clean termination to ensure no orphaned background processes remain in memory.

---

### 📦 Download Windows Desktop Packages

| Asset | Type | Architecture | Description |
|---|---|---|---|
| 💾 [**SheetApp-1.2.0-Windows-x64.exe**](https://github.com/mahimapaseda/Sussex_SheetApp/releases/download/v1.2.0/SheetApp-1.2.0-Windows-x64.exe) | **NSIS Setup Installer** | `x64` | Standard Windows setup installer with desktop and start menu shortcuts |
| 🚀 [**SheetApp-1.2.0-Portable-x64.exe**](https://github.com/mahimapaseda/Sussex_SheetApp/releases/download/v1.2.0/SheetApp-1.2.0-Portable-x64.exe) | **Standalone Portable** | `x64` | Standalone executable requiring zero installation — run directly anywhere |

---
**Engineering by Mahima Paseda** · [www.mahimapaseda.lk](https://www.mahimapaseda.lk)
