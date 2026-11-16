# SheetApp

**SheetApp** is an automated workflow software bridging **Google Sheets** and **WhatsApp Web** via QR code authentication. It analyzes spreadsheet data and dispatches personalized WhatsApp messages in compliance-controlled batches with humanized jitter, cooldown pauses, and anti-ban safeguards.

---

## Architecture & System Prompt

- **[AI Instruction Prompt & System Specification](file:///c:/Users/User/Documents/GitHub/Sussex_SheetApp/AI_INSTRUCTION_PROMPT.md)**: Full master prompt to instruct any AI or engineering team to build the backend, Google Sheets ingestion, WhatsApp Chromium client, rate-limit batcher, and deduplication ledger.
- **[Design System Specification](file:///c:/Users/User/Documents/GitHub/Sussex_SheetApp/design-system/component-specs.md)**: Three-layer design tokens and component specs for UI development.
- **[Design Tokens JSON](file:///c:/Users/User/Documents/GitHub/Sussex_SheetApp/design-system/tokens.json)**: Machine-readable JSON token definitions.
- **[Design Tokens CSS](file:///c:/Users/User/Documents/GitHub/Sussex_SheetApp/design-system/tokens.css)**: Ready-to-import CSS custom properties.

---

## Key Features

1. **Google Sheets Sync**: Real-time multi-sheet ingestion with dynamic column detection (`Name`, `Phone`, `Status`).
2. **QR Code WhatsApp Pairing**: Headless session authentication with local credential persistence via `whatsapp-web.js`.
3. **Anti-Ban Batching & Platform Compliance**:
   - Customizable chunk sizes (10–20 messages per batch).
   - Randomized inter-message delays (12–25 seconds) to mimic human typing/sending patterns.
   - Inter-batch cooldown breaks (3–5 minutes) between consecutive chunks.
   - Daily volume quotas and circuit breakers for failed message sequences.
4. **Deduplication Ledger & Two-Way Status Writeback**: Prevents duplicate sends and updates the Google Sheet with delivery timestamps.
