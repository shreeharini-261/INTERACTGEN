# AURA - Adaptive Web Agent

AURA is an intelligent web analysis tool that transforms any webpage into structured, mode-specific content using Google's Gemini AI.

## What is AURA?

AURA analyzes webpages and adapts its output based on three distinct user modes:
- **Student Mode**: Study notes, flashcards, definitions, and exam-ready materials
- **Researcher Mode**: Methodology extraction, research findings, and academic insights
- **Professional Mode**: KPIs, pricing analysis, SWOT, and business intelligence

## Features

- Split-screen interface with webpage preview
- Three analysis modes for different use cases
- AI-powered content extraction and summarization
- **Teleport Navigation**: Click action buttons to jump to sections within the sidebar
- **Related Pages (Yellow Buttons)**: Opens real, relevant pages from the analyzed website in new tabs
- **Agent Chat**: Ask follow-up questions about the analyzed content with proper Markdown formatting
- **Smart Fallback**: When sections aren't found, AI provides relevant information
- Real-time webpage loading and analysis

## Recent Updates

### Teleport Navigation (Change 1)
Action buttons now scroll to sections within the analysis sidebar instead of attempting to scroll the iframe (which fails due to cross-origin restrictions). Each section has a unique ID and clicking an action highlights and scrolls to that section.

### Gemini Agent Chat (Change 2)
After analyzing a webpage, a chat panel appears where you can ask follow-up questions. The AI assistant:
- Uses the same webpage context from the analysis
- Responds ONLY about the analyzed webpage
- Behaves according to the selected mode's persona
- Acts as an analysis agent, not a general chatbot

### Smart Action Fallback
If you click an action (e.g., "View Pricing") and that section wasn't extracted, the system automatically uses the Gemini agent to provide relevant information based on the webpage content.

## How to Run

### Prerequisites
- Python 3.11+
- Gemini API Key (set in environment)

### Installation

```bash
# Install dependencies
pip install -r aura/requirements.txt

# Set your Gemini API key
export GEMINI_API_KEY=your_api_key_here

# Run the application
python aura/main.py
```

The application will start on `http://localhost:5000`

### Quick Start on Replit

1. The project is pre-configured to run automatically
2. Click the "Run" button
3. The web interface will open showing the Wikipedia AI article

## Architecture

```
+-----------------------------------------------------------+
|                      AURA Frontend                         |
|  +-------------+                    +-----------------+    |
|  |   Sidebar   |                    |   Web Viewer    |    |
|  |  - URL Input|                    |   (iframe)      |    |
|  |  - Mode     |                    |                 |    |
|  |  - Results  |                    |   Wikipedia/    |    |
|  |  - Actions  |                    |   Any URL       |    |
|  |  - Agent    |                    |                 |    |
|  |    Chat     |                    |                 |    |
|  +-------------+                    +-----------------+    |
+-----------------------------+-----------------------------+
                              |
                       POST /analyze
                       POST /chat
                              |
+-----------------------------v-----------------------------+
|                     Flask Backend                          |
|  +----------+    +--------------+    +---------------+    |
|  | Fetcher  |--->|  DOM Parser  |--->|  Agent Core   |    |
|  +----------+    +--------------+    +-------+-------+    |
|                                              |            |
|            +---------------------+-----------+--------+   |
|            |                     |                    |   |
|     +------+-----+  +------------+--+  +-------------+|   |
|     |  Student   |  |  Researcher   |  | Professional||   |
|     |   Mode     |  |     Mode      |  |     Mode    ||   |
|     +------+-----+  +-------+-------+  +------+------+|   |
|            +----------------+-----------------+       |   |
|                             v                         |   |
|                  +------------------+                 |   |
|                  |  Gemini Client   |                 |   |
|                  |   (Gemini API)   |                 |   |
|                  +------------------+                 |   |
+-----------------------------------------------------------+
```

## Project Structure

```
/aura
   |-- main.py                  # Flask app entry point
   |-- agents/
   |     |-- gemini_client.py   # Gemini API wrapper
   |     |-- agent_core.py      # Core agent logic + chat
   |     |-- mode_student.py    # Student transformation
   |     |-- mode_researcher.py # Researcher transformation
   |     |-- mode_professional.py # Professional transformation
   |
   |-- utils/
   |     |-- dom_parser.py      # Parse webpage into sections
   |     |-- fetcher.py         # Fetch webpage HTML
   |
   |-- templates/
   |     |-- index.html         # Main UI with agent chat
   |
   |-- static/
   |     |-- styles.css         # Styles including chat panel
   |     |-- script.js          # Frontend logic with teleport
   |
   |-- requirements.txt
```

## Mode Explanations

### Student Mode
Transforms content into study-friendly materials:
- 5-point summary
- Key definitions
- Flashcard Q&A pairs
- Exam-ready notes
- Highlighted concepts

### Researcher Mode
Analyzes content with academic focus:
- Methodology extraction
- Key results/findings
- Research gaps
- Statistics and metrics
- Paper-style outline

### Professional Mode
Business-oriented analysis:
- Executive summary
- KPIs and metrics
- Pricing breakdown
- SWOT analysis
- Competitive insights

## API Endpoints

### POST /analyze
Analyze a webpage with the specified mode.

**Request:**
```json
{
  "url": "https://example.com",
  "mode": "student"
}
```

**Response:**
```json
{
  "summary": "...",
  "key_points": [...],
  "highlights": [...],
  "actions": [
    {"label": "View Definitions", "section_id": "definitions"}
  ],
  "definitions": [...],
  "flashcards": [...]
}
```

### POST /chat
Ask follow-up questions about the analyzed content.

**Request:**
```json
{
  "url": "https://example.com",
  "message": "What are the main applications of AI?",
  "mode": "student"
}
```

**Response:**
```json
{
  "response": "Based on the analyzed webpage..."
}
```

### POST /missing-section
Get AI-generated information when a section isn't available.

**Request:**
```json
{
  "url": "https://example.com",
  "section_label": "Pricing",
  "mode": "professional"
}
```

### GET /health
Health check endpoint.

## Demo URLs

The following URLs are recommended for testing:

1. **Wikipedia AI Article** (default): `https://en.wikipedia.org/wiki/Artificial_intelligence`
2. **SRM Admissions**: `https://www.srmist.edu.in/admissions/`
3. **Nintendo Store**: `https://www.nintendo.com/us/store/products/metroid-prime-4-beyond-nintendo-switch-2-edition-switch-2/`

## Technology Stack

- **Backend**: Python, Flask
- **AI**: Google Gemini API (gemini-2.0-flash)
- **Frontend**: HTML, CSS, JavaScript (no frameworks)
- **Parsing**: BeautifulSoup, lxml
