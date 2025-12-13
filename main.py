import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from agents.agent_core import analyze_webpage, agent_followup_response, handle_missing_section

app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')
CORS(app)

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        url = data.get('url')
        mode = data.get('mode', 'student')
        
        if not url:
            return jsonify({"error": "URL is required"}), 400
        
        if mode not in ['student', 'researcher', 'professional']:
            return jsonify({"error": "Invalid mode. Choose: student, researcher, professional"}), 400
        
        result = analyze_webpage(url, mode)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        url = data.get('url')
        message = data.get('message')
        mode = data.get('mode', 'student')
        
        if not url:
            return jsonify({"error": "URL is required"}), 400
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        response = agent_followup_response(url, message, mode)
        
        return jsonify({"response": response})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/missing-section', methods=['POST'])
def missing_section():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        url = data.get('url')
        section_label = data.get('section_label')
        mode = data.get('mode', 'student')
        
        if not url or not section_label:
            return jsonify({"error": "URL and section_label are required"}), 400
        
        response = handle_missing_section(url, section_label, mode)
        
        return jsonify({"response": response})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "service": "AURA"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
