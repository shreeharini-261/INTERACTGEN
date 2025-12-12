import requests
from bs4 import BeautifulSoup

def fetch_webpage(url):
    """Fetch webpage HTML content from URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch webpage: {str(e)}")

def get_page_title(html):
    """Extract page title from HTML"""
    soup = BeautifulSoup(html, 'lxml')
    title_tag = soup.find('title')
    return title_tag.get_text().strip() if title_tag else "Untitled Page"
