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

    const notepadToggle = document.getElementById('notepadToggle');
    const notepadDrawer = document.getElementById('notepadDrawer');
    const notesContainer = document.getElementById('notesContainer');
    const clearNotesBtn = document.getElementById('clearNotesBtn');

    let currentAnalysisData = null;
    let currentUrl = null;
    let currentMode = 'student';
    let cogniParseNotes = JSON.parse(localStorage.getItem('cogniParseNotes') || '[]');

    notepadToggle.addEventListener('click', function() {
        notepadDrawer.classList.toggle('open');
    });

    clearNotesBtn.addEventListener('click', function() {
        cogniParseNotes = [];
        localStorage.setItem('cogniParseNotes', JSON.stringify(cogniParseNotes));
        updateNotepadUI();
    });

    function updateNotepadUI() {
        notesContainer.innerHTML = '';
        
        if (cogniParseNotes.length === 0) {
            notesContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px; text-align: center;">No notes saved yet. Analyze a page and click "Save to Notes" on any section.</p>';
            return;
        }
        
        cogniParseNotes.forEach((note, index) => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-item';
            noteDiv.innerHTML = `
                <div class="note-mode">${note.mode} Mode</div>
                <div class="note-text">${note.text}</div>
            `;
            noteDiv.addEventListener('click', function() {
                sendNoteToChat(note.text);
            });
            notesContainer.appendChild(noteDiv);
        });
    }

    async function sendNoteToChat(noteText) {
        if (!currentUrl) {
            addAgentMessage("Please analyze a webpage first before discussing notes.");
            return;
        }

        agentChat.style.display = 'block';
        addUserMessage(`Analyze this saved note: ${noteText.substring(0, 100)}...`);
        chatSendBtn.disabled = true;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: currentUrl,
                    message: `Analyze or expand this saved note: ${noteText}`,
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

        agentChat.scrollIntoView({ behavior: 'smooth' });
    }

    async function saveToNotes(sectionContent, sectionTitle) {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            const response = await fetch('/create_note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: `${sectionTitle}: ${sectionContent}`,
                    mode: currentMode,
                    context: currentAnalysisData ? currentAnalysisData.summary : ''
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save note');
            }

            cogniParseNotes.push({
                text: data.note,
                mode: currentMode,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('cogniParseNotes', JSON.stringify(cogniParseNotes));
            updateNotepadUI();

            btn.textContent = 'Saved!';
            btn.classList.add('saved');
        } catch (error) {
            btn.textContent = 'Error - Try Again';
            console.error('Save note error:', error);
        } finally {
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = 'Save to Notes';
                btn.classList.remove('saved');
            }, 2000);
        }
    }

    window.saveToNotes = saveToNotes;

    updateNotepadUI();

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
        let html = text
            .replace(/```[\s\S]*?```/g, function(match) {
                const code = match.replace(/```/g, '').trim();
                return `<pre><code>${escapeHtml(code)}</code></pre>`;
            })
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/__([^_]+)__/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/_([^_]+)_/g, "<em>$1</em>")
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
            .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
            .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
            .replace(/^\* (.*?)$/gm, "<li>$1</li>")
            .replace(/^- (.*?)$/gm, "<li>$1</li>")
            .replace(/^(\d+)\. (.*?)$/gm, "<li>$2</li>")
            .replace(/(<li>.*?<\/li>)/s, function(match) {
                if (!match.includes('<ul>')) {
                    return '<ul>' + match + '</ul>';
                }
                return match;
            })
            .replace(/\n\n+/g, "</p><p>")
            .replace(/\n/g, "<br>");
        
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        } else if (!html.startsWith('<p>') && !html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<ul')) {
            html = '<p>' + html + '</p>';
        }
        
        return html;
    }
    
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
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

    function createSaveButton(sectionTitle, sectionContent) {
        return `<button class="save-note-btn" onclick="saveToNotes('${escapeForAttribute(sectionContent)}', '${escapeForAttribute(sectionTitle)}')">Save to Notes</button>`;
    }

    function escapeForAttribute(str) {
        return str.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, ' ').substring(0, 500);
    }

    function displayResults(data, mode) {
        welcomeMessage.style.display = 'none';
        chatOutput.style.display = 'flex';
        chatOutput.innerHTML = '';

        if (data.summary) {
            chatOutput.innerHTML += `
                <div class="result-section" id="section_summary">
                    <h4>Summary</h4>
                    <p class="summary-text">${data.summary}</p>
                    ${createSaveButton('Summary', data.summary)}
                </div>
            `;
        }

        if (data.key_points && data.key_points.length > 0) {
            const keyPointsText = data.key_points.join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_key_points">
                    <h4>Key Points</h4>
                    <ul>
                        ${data.key_points.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                    ${createSaveButton('Key Points', keyPointsText)}
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
            const highlightsText = data.highlights.join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_highlights">
                    <h4>Highlights</h4>
                    <ul>
                        ${data.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                    ${createSaveButton('Highlights', highlightsText)}
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
            const defsText = data.definitions.map(d => `${d.term}: ${d.definition}`).join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_definitions">
                    <h4>Key Definitions</h4>
                    ${data.definitions.map(d => `
                        <div class="definition">
                            <div class="definition-term">${d.term}</div>
                            <div class="definition-text">${d.definition}</div>
                        </div>
                    `).join('')}
                    ${createSaveButton('Definitions', defsText)}
                </div>
            `;
        }

        if (data.flashcards && data.flashcards.length > 0) {
            const flashcardsText = data.flashcards.map(f => `Q: ${f.question} A: ${f.answer}`).join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_flashcards">
                    <h4>Flashcards</h4>
                    ${data.flashcards.map(f => `
                        <div class="flashcard">
                            <div class="flashcard-q">Q: ${f.question}</div>
                            <div class="flashcard-a">A: ${f.answer}</div>
                        </div>
                    `).join('')}
                    ${createSaveButton('Flashcards', flashcardsText)}
                </div>
            `;
        }

        if (data.exam_notes && data.exam_notes.length > 0) {
            const examNotesText = data.exam_notes.join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_exam_notes">
                    <h4>Exam Notes</h4>
                    <ul>
                        ${data.exam_notes.map(n => `<li>${n}</li>`).join('')}
                    </ul>
                    ${createSaveButton('Exam Notes', examNotesText)}
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
                    ${createSaveButton('Methodology', data.methodology)}
                </div>
            `;
        }

        if (data.results && data.results.length > 0) {
            const resultsText = data.results.join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_results">
                    <h4>Key Results</h4>
                    <ul>
                        ${data.results.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                    ${createSaveButton('Key Results', resultsText)}
                </div>
            `;
        }

        if (data.statistics && data.statistics.length > 0) {
            const statsText = data.statistics.map(s => `${s.metric}: ${s.value}`).join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_statistics">
                    <h4>Statistics</h4>
                    ${data.statistics.map(s => `
                        <div class="kpi-item">
                            <span class="kpi-name">${s.metric}</span>
                            <span class="kpi-value">${s.value}</span>
                        </div>
                    `).join('')}
                    ${createSaveButton('Statistics', statsText)}
                </div>
            `;
        }

        if (data.research_gaps && data.research_gaps.length > 0) {
            const gapsText = data.research_gaps.join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_research_gaps">
                    <h4>Research Gaps</h4>
                    <ul>
                        ${data.research_gaps.map(g => `<li>${g}</li>`).join('')}
                    </ul>
                    ${createSaveButton('Research Gaps', gapsText)}
                </div>
            `;
        }
    }

    function displayProfessionalResults(data) {
        if (data.kpis && data.kpis.length > 0) {
            const kpisText = data.kpis.map(k => `${k.metric}: ${k.value}`).join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_kpis">
                    <h4>Key Performance Indicators</h4>
                    ${data.kpis.map(k => `
                        <div class="kpi-item">
                            <span class="kpi-name">${k.metric}</span>
                            <span class="kpi-value">${k.value} ${k.trend ? '(' + k.trend + ')' : ''}</span>
                        </div>
                    `).join('')}
                    ${createSaveButton('KPIs', kpisText)}
                </div>
            `;
        }

        if (data.pricing && data.pricing.length > 0) {
            const pricingText = data.pricing.map(p => `${p.tier}: ${p.price}`).join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_pricing">
                    <h4>Pricing</h4>
                    ${data.pricing.map(p => `
                        <div class="definition">
                            <div class="definition-term">${p.tier}: ${p.price}</div>
                            <div class="definition-text">${p.features ? p.features.join(', ') : ''}</div>
                        </div>
                    `).join('')}
                    ${createSaveButton('Pricing', pricingText)}
                </div>
            `;
        }

        if (data.usp && data.usp.length > 0) {
            const uspText = data.usp.join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_usp">
                    <h4>Unique Selling Points</h4>
                    <ul>
                        ${data.usp.map(u => `<li>${u}</li>`).join('')}
                    </ul>
                    ${createSaveButton('USPs', uspText)}
                </div>
            `;
        }

        if (data.swot) {
            const swotText = `Strengths: ${(data.swot.strengths || []).join(', ')}; Weaknesses: ${(data.swot.weaknesses || []).join(', ')}; Opportunities: ${(data.swot.opportunities || []).join(', ')}; Threats: ${(data.swot.threats || []).join(', ')}`;
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
                    ${createSaveButton('SWOT Analysis', swotText)}
                </div>
            `;
        }

        if (data.action_items && data.action_items.length > 0) {
            const actionItemsText = data.action_items.join('; ');
            chatOutput.innerHTML += `
                <div class="result-section" id="section_action_items">
                    <h4>Action Items</h4>
                    <ul>
                        ${data.action_items.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                    ${createSaveButton('Action Items', actionItemsText)}
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
