// Application state
let messages = [];
let currentApiKey = '';
let isStreaming = false;

// DOM elements
const keyInput = document.getElementById('api-key-input');
const validateBtn = document.getElementById('validate-btn');
const keyStatus = document.getElementById('key-status');
const loadingSpinner = document.getElementById('loading-spinner');
const keySection = document.getElementById('key-section');
const creditSection = document.getElementById('credit-section');
const chatSection = document.getElementById('chat-section');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');
const creditStatus = document.getElementById('credit-status');
const creditModels = document.getElementById('credit-models');
const creditKeyPrefix = document.getElementById('credit-key-prefix');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedKey = sessionStorage.getItem('openai_api_key');
    if (savedKey) {
        currentApiKey = savedKey;
        keyInput.value = savedKey;
        showValidatedState();
    }

    // Keyboard shortcuts
    keyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            validateKey();
        }
    });

    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});

// Validate the API key
async function validateKey() {
    const key = keyInput.value.trim();
    if (!key) {
        showStatus('Please enter an API key.', 'error');
        return;
    }

    setLoading(true);
    showStatus('', '');

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + key
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentApiKey = key;
            sessionStorage.setItem('openai_api_key', key);
            showStatus('Key validated successfully!', 'success');
            displayCreditInfo(key, data);
            showValidatedState();
        } else {
            const errorData = await response.json().catch(function() { return {}; });
            const errorMsg = errorData.error ? errorData.error.message : 'Invalid API key or unauthorized.';
            showStatus(errorMsg, 'error');
        }
    } catch (error) {
        showStatus('Network error: Unable to reach OpenAI API. Check your connection.', 'error');
    } finally {
        setLoading(false);
    }
}

// Display credit and usage information
function displayCreditInfo(key, modelsData) {
    creditStatus.textContent = 'Active';
    creditModels.textContent = modelsData.data ? modelsData.data.length + ' models available' : '--';
    creditKeyPrefix.textContent = key.substring(0, 7) + '...' + key.substring(key.length - 4);

    creditSection.classList.remove('hidden');
}

// Show the validated state (chat visible)
function showValidatedState() {
    creditSection.classList.remove('hidden');
    chatSection.classList.remove('hidden');

    if (!creditStatus.textContent || creditStatus.textContent === '--') {
        creditStatus.textContent = 'Active (restored)';
        creditKeyPrefix.textContent = currentApiKey.substring(0, 7) + '...' + currentApiKey.substring(currentApiKey.length - 4);
        creditModels.textContent = 'Cached session';
    }
}

// Send a chat message
async function sendMessage() {
    const content = chatInput.value.trim();
    if (!content || isStreaming) return;
    if (!currentApiKey) {
        showStatus('Please validate your API key first.', 'error');
        return;
    }

    // Add user message
    messages.push({ role: 'user', content: content });
    appendMessage('user', content);
    chatInput.value = '';

    // Create assistant message bubble for streaming
    const assistantBubble = appendMessage('assistant', '');
    assistantBubble.classList.add('streaming');

    isStreaming = true;
    sendBtn.disabled = true;

    try {
        const model = modelSelect.value;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + currentApiKey
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(function() { return {}; });
            const errorMsg = errorData.error ? errorData.error.message : 'Request failed with status ' + response.status;
            assistantBubble.textContent = 'Error: ' + errorMsg;
            assistantBubble.classList.remove('streaming');
            messages.pop(); // Remove the user message since it failed
            isStreaming = false;
            sendBtn.disabled = false;
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || !line.startsWith('data: ')) continue;

                const data = line.slice(6);
                if (data === '[DONE]') break;

                try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices && parsed.choices[0] && parsed.choices[0].delta;
                    if (delta && delta.content) {
                        assistantContent += delta.content;
                        assistantBubble.textContent = assistantContent;
                        scrollToBottom();
                    }
                } catch (e) {
                    // Skip malformed JSON chunks
                }
            }
        }

        assistantBubble.classList.remove('streaming');
        messages.push({ role: 'assistant', content: assistantContent });
    } catch (error) {
        assistantBubble.textContent = 'Error: Network issue or connection lost.';
        assistantBubble.classList.remove('streaming');
        messages.pop(); // Remove the failed user message
    } finally {
        isStreaming = false;
        sendBtn.disabled = false;
        scrollToBottom();
    }
}

// Append a message bubble to the chat
function appendMessage(role, content) {
    const bubble = document.createElement('div');
    bubble.className = 'message ' + role;
    bubble.textContent = content;
    chatMessages.appendChild(bubble);
    scrollToBottom();
    return bubble;
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show status message
function showStatus(message, type) {
    keyStatus.textContent = message;
    keyStatus.className = 'status-message';
    if (type) {
        keyStatus.classList.add(type);
    }
}

// Set loading state
function setLoading(loading) {
    if (loading) {
        loadingSpinner.classList.remove('hidden');
        validateBtn.disabled = true;
        validateBtn.textContent = 'Validating...';
    } else {
        loadingSpinner.classList.add('hidden');
        validateBtn.disabled = false;
        validateBtn.textContent = 'Validate Key';
    }
}
