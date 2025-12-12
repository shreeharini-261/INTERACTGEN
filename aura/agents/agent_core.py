from agents.mode_student import transform as student_transform
from agents.mode_researcher import transform as researcher_transform
from agents.mode_professional import transform as professional_transform
from utils.fetcher import fetch_webpage
from utils.dom_parser import parse_webpage, get_text_content

def analyze_webpage(url, mode):
    """Main agent function to analyze a webpage based on mode"""
    
    html = fetch_webpage(url)
    
    parsed_content = parse_webpage(html)
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
    
    return result
