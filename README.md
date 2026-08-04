# prathamkuril.github.io

Personal portfolio of **Pratham Kuril** — AI Engineer (Forward-Deployed) building
production LLM, RAG and agentic systems.

**Live:** https://prathamkuril.github.io

## Stack

Hand-written, zero-dependency static site — no framework, no build step.

- `index.html` — long-scroll home (terminal hero, experience, featured projects, skills, education, volunteering, contact)
- `projects.html` — full, filterable project catalog
- `resume.html` — print-optimized résumé (⌘/Ctrl+P → PDF)
- `404.html` — custom not-found page
- `css/style.css` — neo-brutalist "terminal / cyber" design system
- `js/main.js` — terminal typewriter, ⌘K command palette, scroll reveal, stat counters, marquee, boot sequence
- `assets/` — imagery, logos, favicon

Design language: dark neo-brutalism — bold outlines, hard offset shadows, monospace
accents. Fonts (Space Grotesk / JetBrains Mono / Inter) load from Google Fonts; everything
else is local. All motion respects `prefers-reduced-motion`.

## Develop / preview

No install needed — it's static. To preview locally:

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Deploy

GitHub Pages serves the repo root from the `main` branch (user site). Push to `main` to
publish; `.nojekyll` disables Jekyll processing.
