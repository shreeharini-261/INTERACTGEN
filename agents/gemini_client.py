import os
import json
import re
from google import genai

client = None

def init_client():
    """Initialize the Gemini client"""
    global client
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        raise Exception("GEMINI_API_KEY environment variable not set")
    client = genai.Client(api_key=api_key)
    return client

def get_client():
    """Get or initialize the Gemini client"""
    global client
    if client is None:
        init_client()
    return client

def generate_response(prompt, system_instruction=None):
    """Generate a response from Gemini"""
    try:
        gemini_client = get_client()
        
        full_prompt = prompt
        if system_instruction:
            full_prompt = f"{system_instruction}\n\n{prompt}"
        
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt
        )
        
        return response.text
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

def parse_json_response(response_text):
    """Parse JSON from Gemini response, handling markdown code blocks"""
    text = response_text.strip()
    
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if json_match:
        text = json_match.group(1).strip()
    
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
        
        return {
            "summary": text,
            "key_points": [],
            "highlights": [],
            "actions": [],
            "transformed_html": f"<div class='content'>{text}</div>"
        }
