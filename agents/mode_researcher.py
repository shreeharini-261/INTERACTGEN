from agents.gemini_client import generate_response, parse_json_response

def transform(content, parsed_content):
    """Transform content for researcher mode"""
    
    links_info = format_links(parsed_content.get('links', []))
    base_url = parsed_content.get('base_url', '')
    
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
    "actions": [
        {"label": "View Methodology", "section_id": "methodology"},
        {"label": "View Results", "section_id": "results"}
    ],
    "related_links": [
        {"label": "References", "url": "https://example.com/refs"},
        {"label": "Related Research", "url": "https://example.com/related"}
    ],
    "transformed_html": "<div class='research-content'>formatted HTML</div>"
}

Focus on:
- Creating an academic-style abstract
- Identifying methodology and research methods
- Extracting key results and statistics
- Finding research gaps and future directions
- Including related_links with REAL URLs found in the webpage for further research
- ONLY use URLs that actually exist in the LINKS section provided - never make up URLs"""

    prompt = f"""Analyze this webpage content from a research perspective:

TITLE: {parsed_content.get('title', 'Unknown')}
BASE URL: {base_url}

HEADINGS:
{format_headings(parsed_content.get('headings', []))}

MAIN CONTENT:
{content[:10000]}

SECTIONS:
{format_sections(parsed_content.get('sections', []))}

TABLES/DATA:
{format_tables(parsed_content.get('tables', []))}

LINKS ON PAGE:
{links_info}

Create a comprehensive research analysis.
For related_links, use ONLY real URLs from the LINKS ON PAGE section above that would help researchers find more information.
Examples: References, Citations, See Also, External Links, Further Reading, Related Topics."""

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

def format_tables(tables):
    """Format tables for prompt"""
    result = []
    for table in tables[:3]:
        result.append('\n'.join([' | '.join(row) for row in table[:5]]))
    return '\n\n'.join(result)

def format_links(links):
    """Format links for prompt"""
    return '\n'.join([f"- {l.get('text', 'Link')}: {l.get('url', '')}" for l in links[:30]])
