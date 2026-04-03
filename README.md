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

- Submit disaster text reports from a clean web UI.
- Backend API endpoint: `POST /api/analyze` with `{ "text": "..." }`.
- AI-powered generalized disaster detection (any disaster type).
- Structured response:
  - `disaster_type`
  - `risk_level` (`Low`, `Medium`, `High`)
  - `confidence`
  - `summary`
- Fallback rule-based classification when AI is unavailable.
- Dashboard listing previous reports with timestamps.
- Emergency alert banner for high-risk reports.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional but recommended) Set OpenAI API key:
   ```bash
   export OPENAI_API_KEY="your_key_here"
   ```

3. Start server:
   ```bash
   npm start
   ```

4. Open:
   - `http://localhost:3000`

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
