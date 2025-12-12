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
- Clickable action suggestions (scroll targets, related links)
- Real-time webpage loading and analysis

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
┌─────────────────────────────────────────────────────────┐
│                      AURA Frontend                       │
│  ┌─────────────┐                    ┌─────────────────┐ │
│  │   Sidebar   │                    │   Web Viewer    │ │
│  │  - URL Input│                    │   (iframe)      │ │
│  │  - Mode     │                    │                 │ │
│  │  - Results  │                    │   Wikipedia/    │ │
│  │  - Actions  │                    │   Any URL       │ │
│  └─────────────┘                    └─────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                     POST /analyze
                            │
┌───────────────────────────▼─────────────────────────────┐
│                     Flask Backend                        │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Fetcher  │───▶│  DOM Parser  │───▶│  Agent Core   │  │
│  └──────────┘    └──────────────┘    └───────┬───────┘  │
│                                              │          │
│            ┌─────────────────────────────────┼──────┐   │
│            │                                 ▼      │   │
│     ┌──────┴─────┐  ┌────────────┐  ┌──────────────┐│   │
│     │  Student   │  │ Researcher │  │ Professional ││   │
│     │   Mode     │  │    Mode    │  │     Mode     ││   │
│     └──────┬─────┘  └─────┬──────┘  └──────┬───────┘│   │
│            └──────────────┼────────────────┘        │   │
│                           ▼                         │   │
│                  ┌─────────────────┐                │   │
│                  │  Gemini Client  │                │   │
│                  │   (Gemini API)  │                │   │
│                  └─────────────────┘                │   │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
/aura
   |-- main.py                  # Flask app entry point
   |-- agents/
   |     |-- gemini_client.py   # Gemini API wrapper
   |     |-- agent_core.py      # Core agent logic
   |     |-- mode_student.py    # Student transformation
   |     |-- mode_researcher.py # Researcher transformation
   |     |-- mode_professional.py # Professional transformation
   |
   |-- utils/
   |     |-- dom_parser.py      # Parse webpage into sections
   |     |-- fetcher.py         # Fetch webpage HTML
   |
   |-- templates/
   |     |-- index.html         # Main UI
   |
   |-- static/
   |     |-- styles.css         # Styles
   |     |-- script.js          # Frontend logic
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

## Sample JSON Output

```json
{
  "summary": "Artificial Intelligence is a field of computer science...",
  "key_points": [
    "AI enables machines to learn from experience",
    "Machine learning is a subset of AI",
    "Deep learning uses neural networks"
  ],
  "highlights": [
    "AI applications in healthcare",
    "Ethical considerations in AI"
  ],
  "actions": [
    {"action": "scroll_to", "target": "#History", "label": "View History"},
    {"action": "open_tab", "url": "https://scholar.google.com", "label": "Find Papers"}
  ],
  "definitions": [
    {"term": "Machine Learning", "definition": "A type of AI that allows..."}
  ],
  "flashcards": [
    {"question": "What is artificial intelligence?", "answer": "AI is..."}
  ]
}
```

## Demo URLs

The following URLs are recommended for testing:

1. **Wikipedia AI Article** (default): `https://en.wikipedia.org/wiki/Artificial_intelligence`
2. **MIT Admissions**: `https://www.mit.edu/admissions/`
3. **Notion Pricing**: `https://www.notion.so/pricing`

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
  "actions": [...],
  "transformed_html": "..."
}
```

### GET /health
Health check endpoint.

## Technology Stack

- **Backend**: Python, Flask
- **AI**: Google Gemini API
- **Frontend**: HTML, CSS, JavaScript (no frameworks)
- **Parsing**: BeautifulSoup, lxml
