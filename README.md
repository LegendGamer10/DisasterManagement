# AI-Powered Disaster Detection System (Full-Stack Prototype)

This project is a production-like hackathon prototype with this flow:

**Frontend (HTML/CSS/JS) → Backend (Node.js + Express) → AI API (OpenAI) → Storage (in-memory reports)**

## Project Structure

```
/frontend
  index.html
  style.css
  app.js

/backend
  server.js
  routes/
    analyze.js
  services/
    ai.js
```

## Features

- Text report input with AI-based analysis.
- Optional image upload (filename captured in dashboard for demo tracking).
- Location input with live geocoding + map marker display.
- Backend API endpoint: `POST /api/analyze` with `{ "text": "..." }`.
- Structured response:
  - `disaster_type`
  - `risk_level` (`Low`, `Medium`, `High`)
  - `confidence`
  - `summary`
- Fallback rule-based classification when AI is unavailable.
- Dashboard listing previous reports with timestamps, location, and image name.
- Emergency alert banner for high-risk reports.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add environment variables:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and set your real key:
   ```env
   OPENAI_API_KEY=your_real_openai_api_key
   PORT=3000
   ```

   **OR**, if `.env` is not working in your runtime, place your key directly in:
   - `backend/config/local.js`
   - Set `OPENAI_API_KEY: 'your_real_openai_api_key'`

4. Start server:
   ```bash
   npm start
   ```

5. Open:
   - `http://localhost:3000`

> If `OPENAI_API_KEY` is missing/invalid in both `.env` and `backend/config/local.js`, the app still works but returns fallback analysis.

## API

### `POST /api/analyze`
Request:
```json
{ "text": "Large wildfire is spreading quickly toward nearby homes." }
```

Response:
```json
{
  "disaster_type": "Wildfire",
  "risk_level": "High",
  "confidence": "92%",
  "summary": "Rapidly spreading wildfire threatening residential areas."
}
```

### `GET /api/reports`
Returns previously analyzed reports stored in memory for this demo.

## Notes

- In-memory storage resets when server restarts.
- To make this fully persistent, replace in-memory storage with Supabase/PostgreSQL.
