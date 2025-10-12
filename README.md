# Check Generator

Check Generator is an offline-first React + Tauri application that converts Excel spreadsheets into print-ready check layouts. Every step—from parsing workbooks to rendering SVG pages—runs entirely on the client, so the tool can be deployed as a PWA or bundled desktop app for strict offline environments.

## Key Features
- Upload `.xlsx` files locally and preview each check in an SVG canvas.
- Template-driven layout (`src/templates/*.json`) with precise coordinates, fonts, decor, and optional header inputs.
- Per-template header inputs are persisted with `localStorage`, so frequently used values are restored after refresh.
- Horizontal carousel for record previews with click and arrow-key navigation.
- One-click printing that respects the template page size for both browser and Tauri targets.
- No external APIs, CDNs, or network requests—everything is bundled with the app.

## Project Structure
```
check-gen/
├── src/
│   ├── agents/             # File/Data/Template/Render/Export/UI/Platform agents
│   ├── templates/          # Bundled JSON templates (default_tw_bank.json)
│   ├── utils/              # Value formatting helpers
│   ├── styles/             # Print & tailwind styles
│   └── App.tsx, main.tsx   # React entry points
├── public/                 # Local fonts, logos, icons
├── src-tauri/              # Tauri configuration and Rust harness
├── package.json            # Scripts and dependencies
└── AGENTS.md               # Architectural guide and roadmap
```

## Prerequisites
- Node.js 18+ and npm.
- (For desktop builds) Rust toolchain with `cargo` and the Tauri prerequisites for your OS (see the [Tauri docs](https://tauri.app/v1/guides/getting-started/prerequisites/)).

## Installation & Local Development
```bash
npm install

# Web/PWA dev server
npm run dev

# Desktop app (wraps the same Vite dev server)
npm run tauri dev
```

During development the Tauri shell proxies the Vite dev server (`http://localhost:5174`), so changes in `src/` hot-reload in both the browser and the desktop window.

## Building for Production
- **Web/PWA bundle**: `npm run build` creates the optimized `dist/` output. `npm run preview` serves the built site for smoke testing.
- **Desktop packages**: `npm run tauri build` compiles platform-specific installers/binaries under `src-tauri/target/`.

Both builds embed fonts, icons, and templates locally to maintain offline behavior.

## Using the App
1. Launch the web app or desktop build.
2. Click **上傳 Excel** and choose an `.xlsx` file. The first worksheet is parsed; the header row defines column names.
3. Choose a template from the dropdown. The default template expects columns like `check_id`, `payee`, and `amount` (numeric for formatting).
4. Fill any template-defined header inputs (e.g., 月份、到期日). Values persist across sessions via `localStorage` (`check-generator:template-inputs:<templateId>`).
5. Scroll horizontally or use `←/→` to inspect each generated page.
6. Click **Print** to open the system print dialog. The SVG pages are sized according to `template.page` (width/height in `mm` by default). For browser printing, disable additional margins or scaling for accurate output.

## Excel File Requirements
- Keep the sheet header in row 1; each subsequent row becomes a check record.
- Provide columns for every `fields[].key` referenced by the active template. The default template uses:
  - `check_id`
  - `payee`
  - `amount` (numeric; reused for currency and Chinese uppercase formats)
- Additional columns remain accessible and can be mapped by future templates.

## Template Customization
- Templates live in `src/templates/` as JSON files. The active template is bundled via ES import inside `TemplateAgent`.
- Each `field` supports:
  - `key`: binds to a column in the current record.
  - `static`: fixed text rendered as-is.
  - `input`: adds a user-supplied header field (`key`, `label`, `placeholder`, `defaultValue`). Input values are merged into the template render via `customInputs`.
  - `x`, `y`, `w`, `align`, `fontSize`, `fontWeight`, `fill`, `letterSpacing` for precise layout.
- `decor` items (`rect`, `line`, `image`) draw non-data elements; coordinates share the same unit system as `page` (top-left origin).
- To add a template:
  1. Create a new JSON file in `src/templates/`.
  2. Import and register it inside `TemplateAgent` (e.g., include in the `bundled` array).
  3. Restart the dev server to pick up the change.

## Persisted Header Inputs
- Header inputs are saved per template key in `localStorage` under `check-generator:template-inputs:<templateId>`.
- To reset defaults, clear the relevant entry from DevTools > Application > Local Storage or use `localStorage.removeItem()` in the console.

## Printing Tips
- Templates set exact page dimensions via injected `@media print` rules. Keep printer scaling at 100% and disable additional margins.
- Multi-page jobs render all records in sequence; for PWA usage consider browser settings that suppress extra blank sheets.

## Roadmap Highlights
- Visual template editor (drag/drop, snapping) planned under StyleAgent.
- Native print enhancements and additional export formats (e.g., PDF generator) via Tauri commands.
- Extended data normalization inside `DataAgent` (mapping, validation, locale-aware formatting).

Contributions and feedback are welcome—use AGENTS.md as the authoritative guide when extending agents or adding platform-specific capabilities.

