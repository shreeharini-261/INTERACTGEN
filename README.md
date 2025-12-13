# CogniParse - Adaptive Web Agent

CogniParse is an intelligent web analysis tool that transforms any webpage into structured, mode-specific content using Google's Gemini AI.

## What is CogniParse?

CogniParse analyzes webpages and adapts its output based on three distinct user modes:
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
- **Collapsible Notepad Drawer**: Save and manage notes from analyzed content (right sidebar)
- **Gemini-powered Note Generation**: AI cleans and formats saved notes based on mode


## How to Run

### Prerequisites
- Python 3.11+
- Gemini API Key (set in environment)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set your Gemini API key
export GEMINI_API_KEY=your_api_key_here

# Run the application
python main.py
```

The application will start on `http://localhost:5000`


## Architecture

```
[User] → [Frontend: Left Sidebar + Iframe + Right Notepad Drawer]
       → [Flask Backend]
       → [Gemini API]
       → [Mode Logic + Notes Engine]

+-----------------------------------------------------------+
|                   CogniParse Frontend                      |
|  +-------------+                    +-----------------+    |
|  |   Sidebar   |                    |   Web Viewer    |    |
|  |  - URL Input|                    |   (iframe)      |    |
|  |  - Mode     |                    |                 |    |
|  |  - Results  |                    |   Wikipedia/    |    |
|  |  - Actions  |                    |   Any URL       |    |
|  |  - Agent    |                    |                 |    |
|  |    Chat     |                    +-----------------+    |
|  +-------------+                    +-------------+        |
|                                     |  Notepad    |        |
|                                     |  Drawer     |        |
|                                     | (Right Side)|        |
|                                     +-------------+        |
+-----------------------------+-----------------------------+
                              |
                       POST /analyze
                       POST /chat
                       POST /create_note
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
|                             |                         |   |
|                  +------------------+                 |   |
|                  |  Notes Engine    |                 |   |
|                  +------------------+                 |   |
+-----------------------------------------------------------+
```

## Project Structure

```
/
├── main.py                    # Flask app entry point
├── agents/
│   ├── gemini_client.py       # Gemini API wrapper
│   ├── agent_core.py          # Core agent logic + chat + notes
│   ├── mode_student.py        # Student transformation
│   ├── mode_researcher.py     # Researcher transformation
│   └── mode_professional.py   # Professional transformation
├── utils/
│   ├── dom_parser.py          # Parse webpage into sections
│   └── fetcher.py             # Fetch webpage HTML
├── templates/
│   └── index.html             # Main UI with agent chat and notepad
├── static/
│   ├── styles.css             # Styles including chat panel and notepad
│   └── script.js              # Frontend logic with teleport and notes
└── requirements.txt
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

## Notepad Feature

The collapsible Notepad drawer on the right side allows you to:
- **Save Notes**: Click "Save to Notes" on any extracted section
- **AI-Cleaned Notes**: Gemini formats notes based on your selected mode
- **Click to Discuss**: Click any saved note to send it to Agent Chat for further analysis
- **Persistent Storage**: Notes are saved in browser localStorage
- **Clear All**: Remove all saved notes with one click

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

### POST /create_note
Create a cleaned note from section content.

**Request:**
```json
{
  "text": "Section content to save",
  "mode": "student",
  "context": "Analysis summary context"
}
```

**Response:**
```json
{
  "note": "Cleaned and formatted note content"
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
- **Notes**: Gemini-powered note generation with localStorage persistence
