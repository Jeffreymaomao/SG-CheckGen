# 🧩 AGENTS.md
**Project Name:** Check Generator  
**Purpose:** A fully offline tool that generates printable checks from Excel (.xlsx) using customizable templates.  
**Platforms:** Web (PWA/offline) and Desktop (Tauri: Windows/macOS/Linux).  
**Privacy:** 100% client-side. No cloud, no external APIs.

---

## 🎯 Goals
1. Upload `.xlsx` → parse → preview checks.
2. Print/export by **template** (SVG-based, precise layout).
3. Simple UI now; optional **visual template editor** later.
4. Ship as **PWA** and **Desktop app (Tauri)** for strict offline environments.

---

## 👥 Agents / Module Responsibilities

### 1) FileAgent (File Reader)
- **Role:** Read and parse `.xlsx` locally.
- **Tech:** SheetJS (`xlsx`).
- **Output:**
  ```js
  [{ payee: "John Wang", amount: 50000, date: "2025-10-09", memo: "Project Bonus" }, ...]
````

* **Desktop specifics (Tauri):** May use `@tauri-apps/api/dialog` for native file pickers.

---

### 2) DataAgent (Validator & Formatter)

* **Role:** Normalize and validate records.
* **Tasks:** amount → uppercase CJK numerals, date formatting, field mapping, required-field checks.
* **Outputs:** clean objects ready for rendering.

---

### 3) TemplateAgent (Template Manager)

* **Role:** Load/switch JSON templates; manage page size, fonts, field coordinates.
* **Spec (example):**

  ```json
  {
    "id": "default_tw_bank",
    "label": "Default (TW)",
    "page": { "unit": "mm", "width": 210, "height": 99, "margin": 6 },
    "font": { "family": "Noto Sans TC", "size": 12, "weight": 500 },
    "fields": [
      { "key": "date", "x": 160, "y": 18, "w": 40, "align": "right", "format": "YYYY年MM月DD日" },
      { "key": "payee","x": 24, "y": 38, "w": 120, "align": "left" },
      { "key": "amount","x": 160,"y": 38,"w": 40, "align": "right","format":"currency" },
      { "key": "amount_cn","x":24,"y":58,"w":176,"align":"left","format":"cjk_upper" },
      { "key": "memo","x": 24, "y": 78, "w": 176, "align": "left" }
    ],
    "decor": [
      { "type": "rect","x":8,"y":8,"w":194,"h":83,"radius":3,"stroke":true,"fill":false }
    ]
  }
  ```
* **Storage:** `.json` files in `src/templates/` (bundled for desktop).

---

### 4) RenderAgent (SVG Renderer)

* **Role:** Produce sharp, print-accurate visuals via **SVG** using template coordinates.
* **Features:** per-record page, alignments, live template switching, overlay boxes for edit mode.

---

### 5) ExportAgent (Print & Export)

* **Web:** `window.print()` + `@page` CSS; optional `html2canvas/jsPDF` for PDF.
* **Desktop (Tauri):**

  * Default: load a print view and call system print dialog.
  * (Future optional) Native print integration (choose printer, trays, margins, silent print) via Tauri plugin or Rust command.
* **Batch:** paginate multiple records; support 1-up or N-up layouts on A4.

---

### 6) UIAgent (Minimal UI Controller)

* **Layout:**

  ```
  [ Upload Excel | Template ▼ ]
  ─────────────────────────────
  [     Check Preview Area     ]
  ─────────────────────────────
  [   Print | Export as PDF    ]
  ```
* **State:** current file, records, active template, current page.

---

### 7) StyleAgent (Visual Template Editor) — *Planned*

* **Edit Mode:** drag & drop fields, resize, tweak font/align; grid/snap overlays.
* **Save:** export updated template as `.json`.
* **Toggle:** Edit ↔ Preview (non-edit) modes.

---

### 8) PlatformAgent (Tauri Bridge)

* **Role:** Encapsulate all platform-specific calls so the app stays framework-agnostic.
* **Web implementation:** no-ops or browser APIs.
* **Desktop (Tauri) implementation:**

  * File dialogs (`@tauri-apps/api/dialog`)
  * Clipboard/FS if ever needed (`@tauri-apps/api/*`)
  * Window controls, app version, logs
  * (Optional) Native printing or OS integrations via `invoke()` to Rust commands

---

## 🔒 Security & Privacy

* No network calls. No external CDNs. All fonts/assets/templates bundled.
* All processing is in memory on the user device.
* Desktop build can disable outbound requests entirely (CSP / app policy).
* Exports (PDF/images) are saved locally by the user.

---

## 🧩 Technology Stack

| Area          | Web                                                  | Desktop                                                |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| App Framework | React + Vite                                         | React + Vite inside **Tauri**                          |
| Styles        | Tailwind CSS                                         | Tailwind CSS                                           |
| XLSX Parse    | SheetJS (`xlsx`)                                     | Same                                                   |
| Render        | SVG                                                  | SVG                                                    |
| Print/Export  | `window.print()`, `@page`, (opt) `html2canvas/jsPDF` | System print dialog; (opt) native print via Tauri/Rust |
| Platform APIs | Browser                                              | `@tauri-apps/api` (+ optional Rust commands)           |

---

## 🪜 Development Phases

1. **MVP:** upload → parse → render via default template → print.
2. **Multi-Template:** switching, template folder, per-template page size.
3. **Export Quality:** refined print CSS, batch PDF/print flows.
4. **Editor:** StyleAgent drag-drop editor, template save/export.
5. **Desktop Enhancements (as needed):** native print options, IT deployment profile.

---

## 📁 Directory Structure

```
check-generator/
├── src/
│   ├── agents/
│   │   ├── FileAgent.ts
│   │   ├── DataAgent.ts
│   │   ├── TemplateAgent.ts
│   │   ├── RenderAgent.tsx
│   │   ├── ExportAgent.ts
│   │   ├── UIAgent.tsx
│   │   └── PlatformAgent.ts   # web/tauri adapters
│   ├── templates/
│   │   └── default_tw_bank.json
│   ├── utils/
│   │   └── formatValue.ts
│   ├── styles/
│   │   └── print.css
│   └── App.tsx
├── public/
│   └── icons, fonts (bundled locally)
├── src-tauri/
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── src/
│       └── main.rs            # optional custom commands for native features
├── package.json
└── AGENTS.md
```

---

## 🧪 Print Layout Guidance

* Prefer SVG for content; use `@page { size: 210mm 99mm; margin: 6mm; }`.
* Provide A4 proof layout (e.g., 2-up/3-up) for testing on common printers.
* Keep fonts embedded (woff2) to avoid substitution issues.

---

## 🛠 Build, Run & Package

### Web / PWA (offline capable)

* No CDNs; bundle fonts/assets.
* Add `vite-plugin-pwa` for offline caching (optional).
* Deploy via GitHub Pages; first open online → install → offline OK.

### Desktop (Tauri)

```bash
npm run tauri dev     # run desktop app for development
npm run tauri build   # package .exe / .dmg / .AppImage
```

* Configure window size, app name, and allowed APIs in `src-tauri/tauri.conf.json`.
* (macOS) Code sign + notarize if distributing widely.
* (Windows) Sign installer if required by IT.

---

## ✅ Definition of Done (MVP)

* Load `.xlsx`, show parsed table preview, render check pages via default template.
* Print produces correct margins/scale on a standard printer.
* No network requests; all assets local.
* Desktop build launches and prints identically to web version.

---