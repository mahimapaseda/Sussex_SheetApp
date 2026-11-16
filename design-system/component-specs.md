# SheetApp Component Specifications & States

This specification outlines the UI components for **SheetApp** built on top of the Three-Layer Token Architecture (`design-system/tokens.css`).

---

## 1. Batch Dispatch Progress Card

Displays live execution of a bulk campaign with inter-message jitter and inter-batch cooldown indicators.

| Property | Default State | In-Flight (Pacing) | In Cooldown Pause | Paused / Aborted |
| :--- | :--- | :--- | :--- | :--- |
| **Header Badge** | `READY` (Slate) | `SENDING (x/y)` (Blue) | `COOLDOWN (mm:ss)` (Amber) | `PAUSED` (Rose) |
| **Progress Fill** | `var(--progress-track)` | `var(--progress-fill)` | `var(--progress-cooldown-fill)` | `var(--rose-500)` |
| **Current Target** | "Waiting to start..." | Recipient Name + Normalized Phone | "Resting WhatsApp connection..." | "Queue paused by user" |
| **Jitter Display** | "Jitter: 12-25s" | Live countdown (e.g. `Next in 14s`) | Paused timer | Inactive |

---

## 2. WhatsApp QR Scanner Modal

Used for pairing the WhatsApp account via browser QR scan.

| Property | Loading / Generating | QR Ready for Scan | Authenticated | Disconnected / Expired |
| :--- | :--- | :--- | :--- | :--- |
| **Card Shadow** | `var(--shadow-md)` | `var(--shadow-lg)` | `var(--shadow-sm)` | `var(--shadow-md)` |
| **QR Frame** | Spinner placeholder | Sharp 256x256 QR Canvas | Green checkmark animation | "Reload QR" button |
| **Status Tag** | `GENERATING QR...` | `SCAN VIA WHATSAPP` | `CONNECTED AS +94...` | `SESSION TIMEOUT` |
| **Instructions** | "Opening Chromium engine..." | "Open WhatsApp > Linked Devices > Scan" | "Ready for batch dispatch" | "Click below to refresh QR" |

---

## 3. Rate-Limit Risk Level Gauge

Dynamic risk calculation based on user batch settings (Batch Size, Inter-Message Delay, Daily Total).

| Configuration | Risk Classification | Badge Color | Guidance Message |
| :--- | :--- | :--- | :--- |
| **Delay > 15s, Batch <= 15, Daily <= 200** | **LOW RISK (Safe)** | Emerald (`var(--gauge-low-risk)`) | "Optimal human-like pacing. Safe for regular accounts." |
| **Delay 8-15s, Batch 15-30, Daily <= 350** | **MODERATE RISK** | Amber (`var(--gauge-mid-risk)`) | "Ensure the account has been active for at least 30 days." |
| **Delay < 8s, Batch > 30, Daily > 350** | **HIGH RISK (Hazardous)** | Rose (`var(--gauge-high-risk)`) | "Warning: High likelihood of temporary WhatsApp ban." |

---

## 4. Google Sheets Column Mapper & Data Grid

| Element | Specification | States |
| :--- | :--- | :--- |
| **Header Matcher** | Auto-detected select dropdowns | `Auto-Detected (Confidence 95%)`, `Manual Selected`, `Missing` |
| **Data Rows** | Compact tabular grid (`--font-sans`, 13px) | `Pending`, `Sending`, `Sent (Checkmark)`, `Failed (Red dot)` |
| **Template Preview** | Card preview with highlighted `{Tokens}` | Live evaluation against Row 1 data |
