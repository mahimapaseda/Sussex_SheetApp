# System Prompt & Specification: Building "SheetApp"
### Google Sheets & WhatsApp Batch Automation Software

> **Target AI / Engineering Directive**: You are tasked with architecting and implementing **SheetApp**, a production-grade desktop and web automation software that bridges **Google Sheets** with **WhatsApp** via headless session management (QR code authentication). The system must analyze spreadsheet data, validate contact numbers, interpolate dynamic message templates, and dispatch messages in controlled batches to strictly comply with WhatsApp anti-spam policies and platform message limits.

---

## 1. System Architecture Overview

```
┌────────────────────────┐      ┌───────────────────────────┐      ┌─────────────────────────┐
│     Google Sheets      │ ───► │      SheetApp Core        │ ───► │      WhatsApp Web       │
│  - Multi-sheet sync    │      │  - Dynamic Column Mapping │      │  - QR Code Scanner      │
│  - Column auto-detect  │      │  - Template Interpolation │      │  - Session Persistence  │
│  - Two-way status write│      │  - Safe Batch Rate-Limiter│      │  - Single-Send Guarantee│
└────────────────────────┘      │  - Deduplication Ledger   │      └─────────────────────────┘
                                └───────────────────────────┘
```

SheetApp operates in three decoupled layers:
1. **Data Ingestion & Sync Layer**: Pulls data from Google Sheets, normalizes phone numbers, dynamically resolves column headers, and tracks row-level execution state.
2. **Batching, Rate Limiting & Safety Layer**: Enforces humanized pacing, randomized delay intervals (jitter), chunked pauses, daily message ceilings, and deduplication ledgers.
3. **WhatsApp Dispatch Layer**: Puppeteer/Chromium headless WhatsApp Web instance with QR code authentication, session caching, and message receipt verification.

---

## 2. Core Functional Requirements

### A. Google Sheets Connector
- **Authentication**:
  - Support **OAuth 2.0 Client Flow** (for end-users with personal/work Google accounts) with local callback loopback server or custom protocol handler (`sheetapp://oauth-callback`).
  - Support **Service Account JSON** authentication (for unattended headless server deployments).
- **Dynamic Schema & Column Mapping**:
  - Automatically detect phone number columns (`Phone`, `Mobile`, `WhatsApp`, `Contact`, `Tel`, `T.P.`).
  - Automatically detect recipient name columns (`Name`, `Full Name`, `Student Name`, `Customer`).
  - Fallback to user-configurable column selector in the UI.
- **Bi-Directional Status Writeback**:
  - Capable of appending or updating a designated `WhatsApp Status` column in the sheet with `SENT`, `FAILED`, or `SKIPPED`, alongside a timestamp to prevent duplicate reprocessing.

### B. WhatsApp Web Automation (QR Authentication)
- **Engine**: Utilize `whatsapp-web.js` (or `baileys` socket client) with Chromium headless execution.
- **QR Code Flow**:
  - Render terminal ASCII QR code and stream data-URL QR codes via WebSocket / REST API to the frontend UI.
  - Automatically detect scan completion and transition state to `AUTHENTICATED` / `READY`.
- **Session Persistence**:
  - Save session tokens to persistent storage (e.g., `LocalAuth` directory) so restarts do not require re-scanning.
  - Support session disconnect, force logout, and graceful teardown.
- **Media & Rich Message Support**:
  - Support plain text, personalized templates, and optional attachment of media (images, PDFs, documents) with captions.

### C. Contact Normalization & Template Engine
- **Phone Number Normalization**:
  - Strip punctuation, spaces, leading zeroes, and dashes.
  - Apply country code inference (e.g., Sri Lanka `+94`, India `+91`, US `+1`, or user-specified default).
  - Verify phone number length and format against national numbering plans before queueing.
- **Template Variable Replacement**:
  - Support mustache-style syntax: `Hi {{Name}}, your balance for {{Month}} is {{Amount}}.`
  - Fallback gracefully when a token row cell is empty (e.g. default placeholder or omit).

### D. Anti-Ban Batching & Platform Compliance Engine (CRITICAL)
WhatsApp employs automated behavior heuristics to detect bulk messaging. SheetApp must strictly enforce:
1. **Configurable Batch Chunks**:
   - Divide active campaign queues into small chunks (e.g., 10 to 20 recipients per chunk).
2. **Humanized Inter-Message Jitter**:
   - Never send messages at fixed intervals. Introduce randomized Gaussian/uniform delays between messages (e.g., `delay = random(12000, 25000)ms` [12 to 25 seconds]).
3. **Inter-Batch Cooldown**:
   - After each chunk, initiate a mandatory cool-down pause (e.g., 3 to 7 minutes) before starting the next batch.
4. **Daily Volume Ceilings**:
   - Cap maximum messages sent per 24 hours based on account maturity:
     - New / Unwarmed accounts: 50 messages/day max.
     - Established accounts: 250–500 messages/day max.
5. **Circuit Breaker / Failure Backoff**:
   - If 3 consecutive messages fail or timeout, immediately halt the queue, alert the operator, and prompt WhatsApp session health check.
6. **Deduplication Ledger**:
   - Local persistent database (SQLite or JSON ledger) storing `recipient_phone + campaign_id + date`. Never send to the same recipient more than once per campaign run.

---

## 3. Technology Stack Recommendations

| Component | Recommended Stack | Alternative |
| :--- | :--- | :--- |
| **App Runtime** | Electron (Desktop) or Node.js + Express (Service) | Tauri (Rust + Webview) |
| **WhatsApp Library** | `whatsapp-web.js` (Puppeteer) | `@whiskeysockets/baileys` |
| **Google Sheets API** | `googleapis` official Node.js SDK | `google-spreadsheet` wrapper |
| **Frontend UI** | Modern HTML5/CSS3 Single Page App with SheetApp Design System | React / Tailwind CSS |
| **Local Storage** | SQLite (`better-sqlite3`) or JSON ledger | LevelDB / Lowdb |

---

## 4. REST API & WebSocket Interface Specification

```
POST /api/sheets/connect         # Connect Google Sheet by URL / ID
GET  /api/sheets/preview         # Fetch headers, row preview, and detected columns
POST /api/sheets/filter          # Apply filter conditions (e.g. status != 'SENT')
GET  /api/whatsapp/qr            # Fetch live QR code (or stream via WS)
GET  /api/whatsapp/status        # Returns 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTED'
POST /api/campaign/dry-run       # Simulate dispatch, validate numbers & token substitutions
POST /api/campaign/start         # Launch compliant batch dispatcher
POST /api/campaign/pause         # Pause queue after current message
POST /api/campaign/resume        # Resume execution
POST /api/campaign/abort         # Cancel remaining queue
GET  /api/campaign/status        # Progress: { total, sent, failed, remaining, currentBatch }
```

---

## 5. UI/UX & Design System Integration

All user interfaces must strictly adhere to the **SheetApp Three-Layer Design System**:
- **Primitive Tokens**: Foundational palette (Emerald Greens, Deep Slates, Ambers for warnings), 4px geometric spacing scale, Inter/JetBrains typography.
- **Semantic Tokens**: Clear operational semantics for batch compliance (`--status-ready`, `--status-pacing`, `--status-cooldown`, `--status-limit-warning`).
- **Component Specs**:
  - **Batch Queue Monitor**: Real-time progress bar with current batch countdown, jitter visualizer, and cooldown timer.
  - **QR Scanner Modal**: Clean high-contrast card with scanning state indicator and timeout countdown.
  - **Compliance Controls**: Granular sliders for batch size, delay min/max, and daily safety quota with automated risk indicator (Low / Medium / High Risk).
