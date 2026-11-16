# SheetApp v1.0.0 - Official Production Release

**SheetApp** is an enterprise-grade Google Sheets & WhatsApp automation platform engineered for the **Sussex College Network**.

### 🌟 Key Highlights & Features

- **Multi-Branch Google Sheet Synchronization:**
  - Real-time ingestion across multiple branch sheets (Ambalangoda, Galle, Ampara, and network campuses) with individual sheet tabs and toggles.
  - Automatic fuzzy column detection for student names, Sri Lankan and international mobile numbers, and branch identifiers.

- **Intelligent Anti-Ban Rate Limiter & Risk Engine:**
  - Smart pacing jitter delays (12 - 22s randomized delay per message).
  - Batch chunking (15 recipients per chunk) with inter-batch cooling resting periods (3 minutes).
  - Daily safety message quota enforcement (250 msgs/day) with live compliance risk calculation.

- **Media & Flyer Broadcast Support:**
  - Seamless campaign flyer/card image sharing with instant drag-and-drop upload (PNG, JPG, WebP up to 10MB).
  - Automatic thumbnail preview, active/paused state toggling, and manual dispatch attachment.

- **Agency-Grade "Single-Screen" Desktop Interface:**
  - Zero-scroll locked viewport architecture (100% fits within screen without page scrolling).
  - Detached floating "Fluid Island" navigation bar with live Sheets and WhatsApp connection indicators.
  - Machined "Double-Bezel" hardware containers with concentric squircle styling.
  - High-contrast luxury typography featuring **Plus Jakarta Sans**, **Outfit**, and **JetBrains Mono**.
  - Internal smooth table scrolling and pinned save controls.

- **Developer Attribution & QR Access:**
  - Dedicated developer attribution modal and QR code linking directly to [www.mahimapaseda.lk](https://www.mahimapaseda.lk).

- **Reliability & Audit Trails:**
  - Fully audited persistent delivery ledger (`sent_log.json`) with CSV export capabilities.
  - 100% clean test suite with 12 unit tests and end-to-end API integration tests.

---
**Engineering by Mahima Paseda** · [www.mahimapaseda.lk](https://www.mahimapaseda.lk)
