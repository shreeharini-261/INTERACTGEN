from bs4 import BeautifulSoup
import re

def parse_webpage(html):
    """Parse webpage HTML and extract structured content"""
    soup = BeautifulSoup(html, 'lxml')
    
    for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
        script.decompose()
    
    content = {
        "title": "",
        "headings": [],
        "paragraphs": [],
        "lists": [],
        "tables": [],
        "links": [],
        "sections": []
    }
    
    title_tag = soup.find('title')
    content["title"] = title_tag.get_text().strip() if title_tag else ""
    
    for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        text = heading.get_text().strip()
        if text:
            heading_id = heading.get('id', '')
            content["headings"].append({
                "level": heading.name,
                "text": text,
                "id": heading_id
            })
    
    for p in soup.find_all('p'):
        text = p.get_text().strip()
        if text and len(text) > 20:
            content["paragraphs"].append(text)
    
    for ul in soup.find_all(['ul', 'ol']):
        items = []
        for li in ul.find_all('li', recursive=False):
            text = li.get_text().strip()
            if text:
                items.append(text)
        if items:
            content["lists"].append(items)
    
    for table in soup.find_all('table'):
        table_data = []
        for row in table.find_all('tr'):
            cells = []
            for cell in row.find_all(['td', 'th']):
                cells.append(cell.get_text().strip())
            if cells:
                table_data.append(cells)
        if table_data:
            content["tables"].append(table_data)
    
    for a in soup.find_all('a', href=True):
        text = a.get_text().strip()
        href = str(a['href'])
        if text and href.startswith('http'):
            content["links"].append({
                "text": text,
                "url": href
            })
    
    main_content = soup.find('main') or soup.find('article') or soup.find('body')
    if main_content:
        current_section = {"heading": "", "content": []}
        for element in main_content.find_all(['h1', 'h2', 'h3', 'h4', 'p']):
            if element.name in ['h1', 'h2', 'h3', 'h4']:
                if current_section["content"]:
                    content["sections"].append(current_section)
                current_section = {
                    "heading": element.get_text().strip(),
                    "id": element.get('id', ''),
                    "content": []
                }
            elif element.name == 'p':
                text = element.get_text().strip()
                if text and len(text) > 20:
                    current_section["content"].append(text)
        
        if current_section["content"]:
            content["sections"].append(current_section)
    
    return content

def get_text_content(html, max_length=15000):
    """Extract clean text content from HTML"""
    soup = BeautifulSoup(html, 'lxml')
    
    for script in soup(["script", "style", "nav", "footer", "header"]):
        script.decompose()
    
    text = soup.get_text(separator='\n')
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    clean_text = '\n'.join(lines)
    
    if len(clean_text) > max_length:
        clean_text = clean_text[:max_length] + "..."
    
    return clean_text
