from agents.gemini_client import generate_response, parse_json_response

def transform(content, parsed_content):
    """Transform content for student mode"""
    
    links_info = format_links(parsed_content.get('links', []))
    base_url = parsed_content.get('base_url', '')
    
    system_instruction = """You are an adaptive web agent helping students learn effectively.
Transform the given webpage content into student-friendly learning materials.

You MUST respond with valid JSON only, no other text. Use this exact structure:
{
    "summary": "A clear 5-point summary of the main concepts",
    "key_points": ["point1", "point2", "point3", "point4", "point5"],
    "definitions": [{"term": "term1", "definition": "def1"}],
    "flashcards": [{"question": "q1", "answer": "a1"}],
    "highlights": ["important concept 1", "important concept 2"],
    "exam_notes": ["note1", "note2"],
    "actions": [
        {"label": "View Definitions", "section_id": "definitions"},
        {"label": "View Flashcards", "section_id": "flashcards"}
    ],
    "related_links": [
        {"label": "Related Topic", "url": "https://example.com/related"},
        {"label": "See Also", "url": "https://example.com/also"}
    ],
    "transformed_html": "<div class='student-content'>formatted HTML content</div>"
}

Focus on:
- Creating a concise 5-point summary
- Extracting key definitions and concepts
- Generating flashcard-style Q&A pairs
- Highlighting exam-worthy material
- Including related_links with REAL URLs found in the webpage that would help students learn more
- ONLY use URLs that actually exist in the LINKS section provided - never make up URLs"""

    prompt = f"""Analyze this webpage content and create student learning materials:

TITLE: {parsed_content.get('title', 'Unknown')}
BASE URL: {base_url}

HEADINGS:
{format_headings(parsed_content.get('headings', []))}

MAIN CONTENT:
{content[:10000]}

SECTIONS:
{format_sections(parsed_content.get('sections', []))}

LINKS ON PAGE:
{links_info}

Create comprehensive student-focused learning materials.
For related_links, use ONLY real URLs from the LINKS ON PAGE section above that would help students learn more about this topic.
Examples: References, See Also, Related Topics, Further Reading, etc."""

    response = generate_response(prompt, system_instruction)
    result = parse_json_response(response)
    
    if "definitions" not in result:
        result["definitions"] = []
    if "flashcards" not in result:
        result["flashcards"] = []
    if "exam_notes" not in result:
        result["exam_notes"] = []
    if "related_links" not in result:
        result["related_links"] = []
    
    return result

def format_headings(headings):
    """Format headings for prompt"""
    return '\n'.join([f"- [{h['level']}] {h['text']} (id: {h.get('id', 'none')})" for h in headings[:20]])

def format_sections(sections):
    """Format sections for prompt"""
    result = []
    for s in sections[:10]:
        heading = s.get('heading', 'Untitled')
        section_id = s.get('id', '')
        content = ' '.join(s.get('content', [])[:3])[:500]
        result.append(f"## {heading} (id: {section_id})\n{content}")
    return '\n\n'.join(result)

def format_links(links):
    """Format links for prompt"""
    return '\n'.join([f"- {l.get('text', 'Link')}: {l.get('url', '')}" for l in links[:30]])
