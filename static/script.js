document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('url-input');
    const modeSelect = document.getElementById('mode-select');
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoader = analyzeBtn.querySelector('.btn-loader');
    const welcomeMessage = document.getElementById('welcome-message');
    const chatOutput = document.getElementById('chat-output');
    const webIframe = document.getElementById('web-iframe');
    const viewerTitle = document.getElementById('viewer-title');
    const openExternal = document.getElementById('open-external');
    const demoBtns = document.querySelectorAll('.demo-btn');
    
    const agentChat = document.getElementById('agent-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatModeLabel = document.getElementById('chat-mode-label');

    let currentAnalysisData = null;
    let currentUrl = null;
    let currentMode = 'student';

    demoBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const url = this.dataset.url;
            urlInput.value = url;
            loadUrl(url);
        });
    });

    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadUrl(this.value);
        }
    });

    urlInput.addEventListener('change', function() {
        loadUrl(this.value);
    });

    function loadUrl(url) {
        if (url) {
            webIframe.src = url;
            viewerTitle.textContent = url;
            openExternal.href = url;
            openExternal.style.display = 'inline';
        }
    }

    analyzeBtn.addEventListener('click', async function() {
        const url = urlInput.value.trim();
        const mode = modeSelect.value;

        if (!url) {
            showError('Please enter a URL');
            return;
        }

        setLoading(true);
        loadUrl(url);
        currentUrl = url;
        currentMode = mode;

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, mode })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            currentAnalysisData = data;
            displayResults(data, mode);
            showAgentChat(mode);
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(loading) {
        analyzeBtn.disabled = loading;
        btnText.style.display = loading ? 'none' : 'inline';
        btnLoader.style.display = loading ? 'inline-block' : 'none';
    }

    function showError(message) {
        welcomeMessage.style.display = 'none';
        chatOutput.style.display = 'flex';
        chatOutput.innerHTML = `<div class="error-message">${message}</div>`;
        agentChat.style.display = 'none';
    }

    function showAgentChat(mode) {
        agentChat.style.display = 'block';
        chatMessages.innerHTML = '';
        chatModeLabel.textContent = mode.charAt(0).toUpperCase() + mode.slice(1) + ' Mode';
        
        addAgentMessage("I've analyzed this webpage. Ask me anything about its content!");
    }

    function formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`(.*?)`/g, "<code>$1</code>")
            .replace(/\n\n/g, "</p><p>")
            .replace(/\n/g, "<br>");
    }

    function addAgentMessage(message) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message agent-message';
        const formattedMessage = formatMarkdown(message);
        msgDiv.innerHTML = `<strong>Agent:</strong><p>${formattedMessage}</p>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addUserMessage(message) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message user-message';
        msgDiv.innerHTML = `<strong>You:</strong> ${message}`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendChatMessage() {
        const message = chatInput.value.trim();
        if (!message || !currentUrl) return;

        addUserMessage(message);
        chatInput.value = '';
        chatSendBtn.disabled = true;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: currentUrl,
                    message: message,
                    mode: currentMode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Chat failed');
            }

            addAgentMessage(data.response);
        } catch (error) {
            addAgentMessage(`Error: ${error.message}`);
        } finally {
            chatSendBtn.disabled = false;
        }
    }

    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    function displayResults(data, mode) {
        welcomeMessage.style.display = 'none';
        chatOutput.style.display = 'flex';
        chatOutput.innerHTML = '';

        if (data.summary) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_summary">
                    <h4>Summary</h4>
                    <p class="summary-text">${data.summary}</p>
                </div>
            `;
        }

        if (data.key_points && data.key_points.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_key_points">
                    <h4>Key Points</h4>
                    <ul>
                        ${data.key_points.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (mode === 'student') {
            displayStudentResults(data);
        } else if (mode === 'researcher') {
            displayResearcherResults(data);
        } else if (mode === 'professional') {
            displayProfessionalResults(data);
        }

        if (data.highlights && data.highlights.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_highlights">
                    <h4>Highlights</h4>
                    <ul>
                        ${data.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (data.actions && data.actions.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_actions">
                    <h4>Actions</h4>
                    <div class="actions-list">
                        ${data.actions.map(a => createActionButton(a)).join('')}
                    </div>
                </div>
            `;
        }

        if (data.related_links && data.related_links.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_related_links">
                    <h4>Related Pages</h4>
                    <div class="actions-list">
                        ${data.related_links.map(link => `<button class="action-btn tab-action" data-url="${link.url}">${link.label}</button>`).join('')}
                    </div>
                </div>
            `;
        }

        attachActionHandlers();
    }

    function displayStudentResults(data) {
        if (data.definitions && data.definitions.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_definitions">
                    <h4>Key Definitions</h4>
                    ${data.definitions.map(d => `
                        <div class="definition">
                            <div class="definition-term">${d.term}</div>
                            <div class="definition-text">${d.definition}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.flashcards && data.flashcards.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_flashcards">
                    <h4>Flashcards</h4>
                    ${data.flashcards.map(f => `
                        <div class="flashcard">
                            <div class="flashcard-q">Q: ${f.question}</div>
                            <div class="flashcard-a">A: ${f.answer}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.exam_notes && data.exam_notes.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_exam_notes">
                    <h4>Exam Notes</h4>
                    <ul>
                        ${data.exam_notes.map(n => `<li>${n}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    function displayResearcherResults(data) {
        if (data.methodology) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_methodology">
                    <h4>Methodology</h4>
                    <p class="summary-text">${data.methodology}</p>
                </div>
            `;
        }

        if (data.results && data.results.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_results">
                    <h4>Key Results</h4>
                    <ul>
                        ${data.results.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (data.statistics && data.statistics.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_statistics">
                    <h4>Statistics</h4>
                    ${data.statistics.map(s => `
                        <div class="kpi-item">
                            <span class="kpi-name">${s.metric}</span>
                            <span class="kpi-value">${s.value}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.research_gaps && data.research_gaps.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_research_gaps">
                    <h4>Research Gaps</h4>
                    <ul>
                        ${data.research_gaps.map(g => `<li>${g}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    function displayProfessionalResults(data) {
        if (data.kpis && data.kpis.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_kpis">
                    <h4>Key Performance Indicators</h4>
                    ${data.kpis.map(k => `
                        <div class="kpi-item">
                            <span class="kpi-name">${k.metric}</span>
                            <span class="kpi-value">${k.value} ${k.trend ? '(' + k.trend + ')' : ''}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.pricing && data.pricing.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_pricing">
                    <h4>Pricing</h4>
                    ${data.pricing.map(p => `
                        <div class="definition">
                            <div class="definition-term">${p.tier}: ${p.price}</div>
                            <div class="definition-text">${p.features ? p.features.join(', ') : ''}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.usp && data.usp.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_usp">
                    <h4>Unique Selling Points</h4>
                    <ul>
                        ${data.usp.map(u => `<li>${u}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (data.swot) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_swot">
                    <h4>SWOT Analysis</h4>
                    <div class="swot-grid">
                        <div class="swot-item strengths">
                            <h5>Strengths</h5>
                            <ul>${(data.swot.strengths || []).map(s => `<li>${s}</li>`).join('')}</ul>
                        </div>
                        <div class="swot-item weaknesses">
                            <h5>Weaknesses</h5>
                            <ul>${(data.swot.weaknesses || []).map(w => `<li>${w}</li>`).join('')}</ul>
                        </div>
                        <div class="swot-item opportunities">
                            <h5>Opportunities</h5>
                            <ul>${(data.swot.opportunities || []).map(o => `<li>${o}</li>`).join('')}</ul>
                        </div>
                        <div class="swot-item threats">
                            <h5>Threats</h5>
                            <ul>${(data.swot.threats || []).map(t => `<li>${t}</li>`).join('')}</ul>
                        </div>
                    </div>
                </div>
            `;
        }

        if (data.action_items && data.action_items.length > 0) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_action_items">
                    <h4>Action Items</h4>
                    <ul>
                        ${data.action_items.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    function createActionButton(action) {
        if (action.section_id) {
            return `<button class="action-btn teleport-action" data-section="${action.section_id}" data-label="${action.label || action.section_id}">${action.label || 'View ' + action.section_id}</button>`;
        } else if (action.action === 'open_tab' && action.url) {
            return `<a href="${action.url}" target="_blank" class="action-btn tab-action">${action.label || 'Open: ' + action.url}</a>`;
        }
        return '';
    }

    function attachActionHandlers() {
        document.querySelectorAll('.action-btn.tab-action').forEach(btn => {
            btn.addEventListener('click', function() {
                const url = this.dataset.url;
                if (url) {
                    window.open(url, '_blank');
                }
            });
        });

        document.querySelectorAll('.action-btn.teleport-action').forEach(btn => {
            btn.addEventListener('click', async function() {
                const sectionId = this.dataset.section;
                const sectionLabel = this.dataset.label;
                const targetElement = document.getElementById('section_' + sectionId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                    targetElement.classList.add('highlight-section');
                    setTimeout(() => {
                        targetElement.classList.remove('highlight-section');
                    }, 2000);
                } else {
                    this.disabled = true;
                    this.textContent = 'Loading...';
                    
                    try {
                        const response = await fetch('/missing-section', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                url: currentUrl,
                                section_label: sectionLabel,
                                mode: currentMode
                            })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.error || 'Failed to get information');
                        }

                        addAgentMessage(data.response);
                        agentChat.scrollIntoView({ behavior: 'smooth' });
                    } catch (error) {
                        addAgentMessage(`Error: ${error.message}`);
                    } finally {
                        this.disabled = false;
                        this.textContent = sectionLabel;
                    }
                }
            });
        });
    }
});
