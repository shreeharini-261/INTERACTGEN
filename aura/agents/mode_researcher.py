from agents.gemini_client import generate_response, parse_json_response

def transform(content, parsed_content):
    """Transform content for researcher mode"""
    
    system_instruction = """You are an adaptive web agent helping researchers analyze content.
Transform the given webpage content into a research-focused analysis.

You MUST respond with valid JSON only, no other text. Use this exact structure:
{
    "summary": "Academic-style abstract summarizing the content",
    "key_points": ["key finding 1", "key finding 2"],
    "methodology": "Description of methods or approaches mentioned",
    "results": ["result1", "result2"],
    "research_gaps": ["gap1", "gap2"],
    "statistics": [{"metric": "name", "value": "value"}],
    "citations": ["potential citation 1"],
    "highlights": ["critical finding 1", "critical finding 2"],
    "paper_outline": {
        "introduction": "summary",
        "background": "summary",
        "methods": "summary",
        "results": "summary",
        "discussion": "summary"
    },
    "actions": [
        {"action": "scroll_to", "target": "#methodology", "label": "View Methodology"},
        {"action": "open_tab", "url": "https://scholar.google.com", "label": "Find Related Papers"}
    ],
    "transformed_html": "<div class='research-content'>formatted HTML</div>"
}

Focus on:
- Creating an academic-style abstract
- Identifying methodology and research methods
- Extracting key results and statistics
- Finding research gaps and future directions
- Organizing content into paper-style outline
- Suggesting related academic resources"""

    prompt = f"""Analyze this webpage content from a research perspective:

TITLE: {parsed_content.get('title', 'Unknown')}

HEADINGS:
{format_headings(parsed_content.get('headings', []))}

MAIN CONTENT:
{content[:10000]}

SECTIONS:
{format_sections(parsed_content.get('sections', []))}

TABLES/DATA:
{format_tables(parsed_content.get('tables', []))}

Create a comprehensive research analysis with methodology extraction, key findings, and research gaps.
Include scroll_to actions for important sections and open_tab actions for related research resources."""

    response = generate_response(prompt, system_instruction)
    result = parse_json_response(response)
    
    if "methodology" not in result:
        result["methodology"] = ""
    if "results" not in result:
        result["results"] = []
    if "research_gaps" not in result:
        result["research_gaps"] = []
    if "statistics" not in result:
        result["statistics"] = []
    if "paper_outline" not in result:
        result["paper_outline"] = {}
    
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

def format_tables(tables):
    """Format tables for prompt"""
    result = []
    for table in tables[:3]:
        result.append('\n'.join([' | '.join(row) for row in table[:5]]))
    return '\n\n'.join(result)
