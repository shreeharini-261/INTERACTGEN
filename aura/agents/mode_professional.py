from agents.gemini_client import generate_response, parse_json_response

def transform(content, parsed_content):
    """Transform content for professional/business mode"""
    
    system_instruction = """You are an adaptive web agent helping professionals analyze business content.
Transform the given webpage content into a business-focused analysis.

You MUST respond with valid JSON only, no other text. Use this exact structure:
{
    "summary": "Executive summary of the content",
    "key_points": ["business insight 1", "business insight 2"],
    "kpis": [{"metric": "name", "value": "value", "trend": "up/down/stable"}],
    "pricing": [{"tier": "name", "price": "amount", "features": ["f1", "f2"]}],
    "usp": ["unique selling point 1", "unique selling point 2"],
    "swot": {
        "strengths": ["s1", "s2"],
        "weaknesses": ["w1", "w2"],
        "opportunities": ["o1", "o2"],
        "threats": ["t1", "t2"]
    },
    "competitors": ["competitor1", "competitor2"],
    "highlights": ["key business insight 1", "key business insight 2"],
    "action_items": ["action1", "action2"],
    "actions": [
        {"action": "scroll_to", "target": "#pricing", "label": "View Pricing"},
        {"action": "open_tab", "url": "https://example.com/demo", "label": "Request Demo"}
    ],
    "transformed_html": "<div class='professional-content'>formatted HTML</div>"
}

Focus on:
- Creating an executive summary
- Extracting KPIs and metrics
- Analyzing pricing structure
- Identifying unique selling points
- SWOT-style analysis
- Competitive positioning
- Actionable business insights"""

    prompt = f"""Analyze this webpage content from a business/professional perspective:

TITLE: {parsed_content.get('title', 'Unknown')}

HEADINGS:
{format_headings(parsed_content.get('headings', []))}

MAIN CONTENT:
{content[:10000]}

SECTIONS:
{format_sections(parsed_content.get('sections', []))}

LINKS:
{format_links(parsed_content.get('links', []))}

Create a comprehensive business analysis with KPIs, pricing analysis, SWOT, and actionable insights.
Include scroll_to actions for important sections and open_tab actions for demos, pricing, or contact pages."""

    response = generate_response(prompt, system_instruction)
    result = parse_json_response(response)
    
    if "kpis" not in result:
        result["kpis"] = []
    if "pricing" not in result:
        result["pricing"] = []
    if "usp" not in result:
        result["usp"] = []
    if "swot" not in result:
        result["swot"] = {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}
    if "competitors" not in result:
        result["competitors"] = []
    if "action_items" not in result:
        result["action_items"] = []
    
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
    return '\n'.join([f"- {l['text']}: {l['url']}" for l in links[:15]])
