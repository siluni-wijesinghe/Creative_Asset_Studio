# Creative Asset Studio

Turn one product image into platform-ready assets, with an optional AI assistant that helps with the words.

Creative Asset Studio is a full-stack prototype built as a **Creative Engineering** project. It started from one question: can a repetitive creative workflow be made simpler by automating the mechanical parts and keeping a person in charge of the creative decisions?

```text
Upload one product image
        ↓
(optional) AI analysis  →  review and approve the text
        ↓
Select platforms  →  Generate assets
        ↓
Download one asset, or everything as a ZIP
(images + only the text you approved)
```

> **Status:** working prototype. It has not been tested with a real business yet (see [What I haven't measured yet](#what-i-havent-measured-yet)).

## The idea

Preparing one product for several channels usually means the same chores every time: resizing and cropping for each platform, adding a logo, naming files consistently, and writing a caption, a description and alt text.

This project splits that work in two:

- **Deterministic code does the mechanical work.** Resizing, cropping, logo placement, file naming, validation and export are plain code, because those tasks have a right answer and should behave the same every time.
- **AI does the semantic work, with a person approving the result.** Looking at a photo and writing words about it is where a model helps. Everything it writes can be edited, regenerated, copied and approved, and **only approved text is exported**.

## Features

### Image workflow
- Drag-and-drop or click-to-browse upload (JPG or PNG)
- Platform presets: Instagram, Website, Marketplace and Facebook. The sizes live in one config file.
- Sensible cropping with `fit: "cover"`, so images are filled and never stretched
- Download one asset, or all of them as a ZIP

### Branding
- Optional logo upload (PNG or JPG)
- Drag-and-resize editor on a live preview, with a "preview shape" switch for each platform
- The same placement is applied to every platform, kept inside the image

### AI assistant (optional)
- **Product analysis** from the photo: name, category, colors, material, visible text, keywords, a confidence score, and what it could *not* tell. Anything that isn't visible is reported as `unknown`.
- **Descriptions** in five tones (short, product page, one-line)
- **Alt text** for accessibility
- **Social captions** for Instagram (with optional hashtags), Facebook and LinkedIn
- **SEO metadata**: title, meta description, keywords
- Every text can be **edited, regenerated, copied and approved**
- Plain-code warnings flag numbers, prices and claims that aren't in the product facts

### Naming and export
- File names follow `brand-product-platform-asset type-version`, for example `acme-blue-ceramic-coffee-mug-instagram-product-v1.jpg`
- The ZIP contains the images and, if any text was approved, `approved-content.txt` organized by platform

## How AI is used (and where it isn't)

| Done by AI (Gemini) | Done by normal code |
|---|---|
| Describing what is visible in a photo | Resizing, cropping, converting, logo placement |
| Descriptions, alt text, captions, SEO text | Platform sizes and length limits |
| Suggesting keywords | **Final file names** (the AI never writes a path or filename) |
| | Validation of every request and every AI answer |
| | Approval and export |

Safeguards:

- The Gemini API key lives only on the server, in `.env`. It is never sent to the browser.
- The photo is shrunk and re-encoded before it is sent, and metadata is stripped.
- Gemini is asked for JSON in a fixed shape. The answer is **validated with Zod**, tidied by our own code, and retried once if it is unusable.
- The analysis is **reused** by the other features, so the image is sent to Gemini once.
- What you type (brand, name, notes) always wins over what the AI guesses. The AI never supplies the brand.
- AI text and text found inside photos are treated as data, never as instructions.
- File names are built from cleaned parts. Letters, numbers and hyphens only, no path characters, no Windows reserved names, with a length limit.
- AI endpoints are rate limited, calls have a timeout, and an overloaded model is retried and can fall back to a second model.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, Tailwind CSS |
| Backend | Node.js, Express |
| Image processing | Sharp |
| Uploads | Multer |
| AI | Google Gemini through the official `@google/genai` SDK |
| Validation | Zod |
| ZIP files | JSZip (in the browser) |

No database and no authentication yet. That's a deliberate choice for this stage.

## Getting started

**You need:** Node.js (a current LTS version), npm, and a Gemini API key from Google AI Studio (only for the AI features).

```bash
# 1. Clone the repository, then install both parts
cd server
npm install
cd ../client
npm install
```

```bash
# 2. Configure the server: copy the example file and add your key
cd ../server
cp .env.example .env        # on Windows: copy .env.example .env
```

Edit `server/.env`:

```text
GEMINI_API_KEY=your-key-goes-here
GEMINI_MODEL=gemini-3.5-flash
GEMINI_FALLBACK_MODEL=
```

`GEMINI_FALLBACK_MODEL` is optional. It is tried only when the main model is overloaded. Model names change over time, so check Google's current model list. You can print the models your key can use with `node scripts/listModels.js`.

```bash
# 3. Run both parts (two terminals)
cd server
npm run dev      # http://localhost:5000

cd client
npm run dev      # http://localhost:5173
```

Open the address that Vite prints. The app works without a Gemini key. Only the AI assistant needs it.

Helpful scripts in `server/scripts`:

| Script | What it checks |
|---|---|
| `testGemini.js` | The key, the model and the connection |
| `testFilename.js`, `testNaming.js` | File naming with hostile inputs |
| `testContent.js`, `testCaption.js` | The text features, using a made-up sample analysis |

## Project structure

```text
creative-asset-studio/
├── client/
│   └── src/
│       ├── components/        UI: upload, platform cards, logo editor, results
│       │   └── ai/            AI assistant: analysis, review cards, sections
│       └── utils/             logo placement, ZIP, API calls, approved-content export
└── server/
    ├── config/                platform presets, naming rules, AI settings
    ├── controllers/           request handlers
    ├── routes/                URL → handler
    ├── services/              Sharp processing, Gemini calls, filename safety
    ├── schemas/               Zod schemas (AI answers and requests)
    ├── prompts/               prompt builders, one per feature
    ├── middleware/            rate limiting
    └── scripts/               test and helper scripts
```

## API

| Method and path | Purpose |
|---|---|
| `GET /api/health` | Is the server running? |
| `GET /api/presets` | The platform presets |
| `POST /api/assets/generate` | Generate the assets (image, platforms, optional logo, placement and naming) |
| `GET /api/assets/download/:jobId/:fileName` | Download one generated file |
| `POST /api/naming/preview` | Preview the final file names (no AI) |
| `POST /api/ai/analyze` | Analyze a photo |
| `POST /api/ai/description` | Product descriptions |
| `POST /api/ai/alt-text` | Alt text |
| `POST /api/ai/caption` | Social captions |
| `POST /api/ai/seo` | SEO metadata |

## Known limitations

- The platform sizes and length limits are prototype presets, not official platform rules**. Check each platform's current guidance before real use.
- All platforms share one logo placement.
- Cropping is always centered, so a product that sits off-center can be cut off.
- Generated files accumulate in `server/generated` and are not cleaned up automatically.
- AI output can be wrong. The approval step and the warnings exist for that reason, but a person must still check each text.
- The AI features need an internet connection, and photos are sent to Google's Gemini API. Check Google's current data-use terms for your account type before using real customer photos.
- No users, no saved projects and no history. Everything lives in the browser session until you export.

## What I haven't measured yet

This is a prototype for testing an idea, so I'm not claiming any time savings. They have to be measured with a real person doing a real task. Planned measurements:

| Task | Before (manual) | With the tool |
|---|---|---|
| Time to prepare one product for three platforms | _to be measured_ | _to be measured_ |
| Edits needed on AI text before approving | n/a | _to be measured_ |
| Mistakes found in AI text | n/a | _to be measured_ |

## Roadmap

- [x] V1: one image to multiple platform-ready assets
- [x] V2: branding (logo, drag-and-resize placement)
- [x] V3: AI assistant with review, approval and safe file naming
- [ ] V4: test with a real business, observe the actual workflow, and change the product based on what I learn
- [ ] Possible later: saved projects (a small database), per-platform logo placement, smarter cropping

## Case study notes

- Problem: repetitive asset preparation across channels
- Approach: automate what has a right answer, assist where words are needed, keep a person responsible for the final content
- Open question: which part of the workflow actually costs the most time for a real user? V4 is meant to answer that.