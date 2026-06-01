# AI همّة الوطني Knowledge Base

This folder contains the static RAG knowledge base for AI همّة الوطني.

Run:

```bash
npm run build:knowledge
```

The build script scans public project content and excludes private credentials, `.env` files, backups, source image folders, and member passwords. Supabase live data is not stored here; the Netlify function fetches public committee, structure, and member data from Supabase at question time.

Generated file:

- `knowledge-base.json`

