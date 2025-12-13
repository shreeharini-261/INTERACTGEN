from agents.mode_student import transform as student_transform
from agents.mode_researcher import transform as researcher_transform
from agents.mode_professional import transform as professional_transform
from agents.gemini_client import generate_response
from utils.fetcher import fetch_webpage
from utils.dom_parser import parse_webpage, get_text_content

analysis_context_cache = {}

def analyze_webpage(url, mode):
    """Main agent function to analyze a webpage based on mode"""
    
    html = fetch_webpage(url)
    
    parsed_content = parse_webpage(html)
    parsed_content["base_url"] = url
    text_content = get_text_content(html)
    
    if mode == "student":
        result = student_transform(text_content, parsed_content)
    elif mode == "researcher":
        result = researcher_transform(text_content, parsed_content)
    elif mode == "professional":
        result = professional_transform(text_content, parsed_content)
    else:
        raise ValueError(f"Invalid mode: {mode}")
    
    result["url"] = url
    result["mode"] = mode
    result["page_title"] = parsed_content.get("title", "")
    
    if "actions" not in result:
        result["actions"] = []
    if "key_points" not in result:
        result["key_points"] = []
    if "highlights" not in result:
        result["highlights"] = []
    if "summary" not in result:
        result["summary"] = ""
    if "transformed_html" not in result:
        result["transformed_html"] = ""
    
    analysis_context_cache[url] = {
        "text_content": text_content[:15000],
        "parsed_content": parsed_content,
        "analysis_result": result,
        "mode": mode
    }
    
    return result

def agent_followup_response(url, message, mode, context=None):
    """Handle follow-up questions about the analyzed webpage"""
    
    cached = analysis_context_cache.get(url, {})
    text_content = cached.get("text_content", context.get("text_content", "") if context else "")
    analysis_result = cached.get("analysis_result", {})
    
    mode_personas = {
        "student": """You are a helpful learning assistant. Answer questions in a clear, educational way.
Use simple explanations and provide examples when helpful. Focus on helping the student understand concepts.""",
        
        "researcher": """You are an academic research assistant. Answer questions with precision and cite relevant details.
Use formal academic language. Focus on methodology, data, findings, and research implications.""",
        
        "professional": """You are a business analyst assistant. Answer questions with actionable insights.
Focus on business value, metrics, ROI, and strategic implications. Be concise and professional."""
    }
    
    system_instruction = mode_personas.get(mode, mode_personas["student"])
    
    analysis_summary = ""
    if analysis_result:
        analysis_summary = f"""
Previous Analysis Summary: {analysis_result.get('summary', 'N/A')}
Key Points: {', '.join(analysis_result.get('key_points', [])[:5])}
Highlights: {', '.join(analysis_result.get('highlights', [])[:3])}
"""
    
    prompt = f"""{system_instruction}

You are an analysis agent for the webpage: {url}

WEBPAGE CONTENT:
{text_content[:8000]}

{analysis_summary}

USER QUESTION: {message}

IMPORTANT RULES:
1. ONLY answer questions related to this webpage's content
2. If the question is unrelated to the webpage, politely redirect to the webpage topic
3. If information is not available in the content, say so clearly
4. Stay in character as the {mode} mode assistant
5. Be helpful and provide specific details from the content when possible

Provide a helpful, focused response:"""

    response = generate_response(prompt)
    return response

def handle_missing_section(url, section_label, mode):
    """When an action's section doesn't exist, generate AI response about that topic"""
    
    cached = analysis_context_cache.get(url, {})
    text_content = cached.get("text_content", "")
    
    if not text_content:
        return f"I don't have enough context to provide information about '{section_label}'. Please analyze a webpage first."
    
    prompt = f"""Based on the following webpage content, please provide information about: {section_label}

WEBPAGE CONTENT:
{text_content[:8000]}

If this specific information ({section_label}) is not directly available in the content, provide your best analysis or explain what related information is available.

Provide a helpful response:"""

    response = generate_response(prompt)
    return f"'{section_label}' section was not found in the extracted content. Based on the webpage, here's what I found:\n\n{response}"
