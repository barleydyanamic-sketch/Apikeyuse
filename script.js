'use strict';

// ============================================================
// PROVIDER REGISTRY
// ============================================================

const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4, GPT-3.5 Turbo',
    icon: '🤖',
    keyPrefix: /^sk-(?!ant-)(?!or-)[A-Za-z0-9]/,
    baseUrl: 'https://api.openai.com',
    validationEndpoint: '/v1/models',
    chatEndpoint: '/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4-turbo'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude Sonnet, Haiku, Opus',
    icon: '🧠',
    keyPrefix: /^sk-ant-/,
    baseUrl: 'https://api.anthropic.com',
    validationEndpoint: '/v1/messages',
    chatEndpoint: '/v1/messages',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    supportsStreaming: true,
    headers: (key) => ({
      'x-api-key': key,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }),
    bodyFormat: (messages, model, stream) => {
      const systemMsg = messages.find(m => m.role === 'system');
      const nonSystemMsgs = messages.filter(m => m.role !== 'system');
      const body = {
        model,
        max_tokens: 1024,
        messages: nonSystemMsgs,
        stream
      };
      if (systemMsg) body.system = systemMsg.content;
      return JSON.stringify(body);
    }
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 2.0 Flash, 1.5 Pro',
    icon: '💎',
    keyPrefix: /^AIza/,
    baseUrl: 'https://generativelanguage.googleapis.com',
    validationEndpoint: '/v1beta/models',
    chatEndpoint: '/v1beta/models/{MODEL}:generateContent',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    supportsStreaming: false,
    headers: () => ({
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => {
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
      return JSON.stringify({ contents });
    }
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral Large, Medium, Small',
    icon: '🌊',
    keyPrefix: null,
    baseUrl: 'https://api.mistral.ai',
    validationEndpoint: '/v1/models',
    chatEndpoint: '/v1/chat/completions',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mixtral-8x22b'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Command R+, Command R',
    icon: '🔮',
    keyPrefix: null,
    baseUrl: 'https://api.cohere.ai',
    validationEndpoint: '/v1/models',
    chatEndpoint: '/v1/chat',
    models: ['command-r-plus', 'command-r', 'command-light'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => {
      const lastMsg = messages[messages.length - 1];
      const chatHistory = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
        message: m.content
      }));
      return JSON.stringify({
        model,
        message: lastMsg.content,
        chat_history: chatHistory,
        stream
      });
    }
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'LLaMA 3.1, Mixtral, Gemma',
    icon: '⚡',
    keyPrefix: /^gsk_/,
    baseUrl: 'https://api.groq.com',
    validationEndpoint: '/openai/v1/models',
    chatEndpoint: '/openai/v1/chat/completions',
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Sonar Large, Small Online',
    icon: '🔍',
    keyPrefix: /^pplx-/,
    baseUrl: 'https://api.perplexity.ai',
    validationEndpoint: '/chat/completions',
    chatEndpoint: '/chat/completions',
    models: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'together',
    name: 'Together AI',
    description: 'LLaMA, Mixtral hosted models',
    icon: '🤝',
    keyPrefix: null,
    baseUrl: 'https://api.together.xyz',
    validationEndpoint: '/v1/models',
    chatEndpoint: '/v1/chat/completions',
    models: ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    description: 'Fast inference for open models',
    icon: '🎆',
    keyPrefix: /^fw_/,
    baseUrl: 'https://api.fireworks.ai',
    validationEndpoint: '/inference/v1/models',
    chatEndpoint: '/inference/v1/chat/completions',
    models: ['accounts/fireworks/models/llama-v3p1-70b-instruct', 'accounts/fireworks/models/mixtral-8x22b-instruct'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Multi-model router',
    icon: '🔀',
    keyPrefix: /^sk-or-/,
    baseUrl: 'https://openrouter.ai',
    validationEndpoint: '/api/v1/models',
    chatEndpoint: '/api/v1/chat/completions',
    models: ['openai/gpt-4o', 'anthropic/claude-sonnet-4-20250514', 'meta-llama/llama-3.1-70b-instruct'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Chat and Coder',
    icon: '🌐',
    keyPrefix: /^sk-(?!ant-)(?!or-)[A-Za-z0-9]/,
    baseUrl: 'https://api.deepseek.com',
    validationEndpoint: '/models',
    chatEndpoint: '/chat/completions',
    models: ['deepseek-chat', 'deepseek-coder'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'ai21',
    name: 'AI21 Labs',
    description: 'Jamba 1.5 Large and Mini',
    icon: '🧬',
    keyPrefix: null,
    baseUrl: 'https://api.ai21.com',
    validationEndpoint: '/v1/chat/completions',
    chatEndpoint: '/v1/chat/completions',
    models: ['jamba-1.5-large', 'jamba-1.5-mini'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Open-source model inference',
    icon: '🤗',
    keyPrefix: /^hf_/,
    baseUrl: 'https://api-inference.huggingface.co',
    validationEndpoint: '/models',
    chatEndpoint: '/v1/chat/completions',
    models: ['meta-llama/Meta-Llama-3-8B-Instruct'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    description: 'Grok Beta',
    icon: '🚀',
    keyPrefix: /^xai-/,
    baseUrl: 'https://api.x.ai',
    validationEndpoint: '/v1/models',
    chatEndpoint: '/v1/chat/completions',
    models: ['grok-beta'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => JSON.stringify({
      model,
      messages,
      stream
    })
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Run open-source models',
    icon: '🔁',
    keyPrefix: /^r8_/,
    baseUrl: 'https://api.replicate.com',
    validationEndpoint: '/v1/models',
    chatEndpoint: '/v1/predictions',
    models: ['meta/llama-2-70b-chat'],
    supportsStreaming: true,
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    bodyFormat: (messages, model, stream) => {
      const prompt = messages.map(m => {
        if (m.role === 'system') return `[INST] <<SYS>>\n${m.content}\n<</SYS>> [/INST]`;
        if (m.role === 'user') return `[INST] ${m.content} [/INST]`;
        return m.content;
      }).join('\n');
      return JSON.stringify({
        version: model,
        input: { prompt },
        stream
      });
    }
  }
];

// ============================================================
// STATE
// ============================================================

let currentProvider = null;
let messages = [];
let abortController = null;

// ============================================================
// KEY DETECTION ENGINE
// ============================================================

const detectProvider = (key) => {
  if (!key || key.trim().length === 0) return [];

  const trimmedKey = key.trim();
  const matched = [];

  // Priority order: most specific prefixes first
  const priorityOrder = [
    'anthropic',   // sk-ant-
    'openrouter',  // sk-or-
    'groq',        // gsk_
    'fireworks',   // fw_
    'huggingface', // hf_
    'xai',         // xai-
    'replicate',   // r8_
    'perplexity',  // pplx-
    'gemini',      // AIza
    'openai',      // sk- (generic)
    'deepseek',    // sk- (generic, same as OpenAI)
    'mistral',
    'cohere',
    'together',
    'ai21'
  ];

  for (const providerId of priorityOrder) {
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.keyPrefix && provider.keyPrefix.test(trimmedKey)) {
      matched.push(provider);
    }
  }

  return matched;
};

// ============================================================
// SEARCH/FILTER
// ============================================================

const searchProviders = (query) => {
  if (!query || query.trim().length === 0) return providers;
  const lowerQuery = query.toLowerCase().trim();
  return providers.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.id.toLowerCase().includes(lowerQuery)
  );
};

// ============================================================
// UTILITIES
// ============================================================

const sanitizeText = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const scrollToBottom = () => {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
};

const trimMessages = (msgs, maxCount = 20) => {
  if (msgs.length <= maxCount) return msgs;
  const system = msgs.filter(m => m.role === 'system');
  const nonSystem = msgs.filter(m => m.role !== 'system');
  return [...system, ...nonSystem.slice(-maxCount)];
};

const renderAssistantContent = (text) => {
  return sanitizeText(text).replace(/\n/g, '<br>');
};

// ============================================================
// SESSION STORAGE
// ============================================================

const saveSession = () => {
  const data = {
    providerId: currentProvider ? currentProvider.id : null,
    key: document.getElementById('apiKeyInput') ? document.getElementById('apiKeyInput').value : ''
  };
  sessionStorage.setItem('aiKeyHub', JSON.stringify(data));
};

const loadSession = () => {
  try {
    const data = JSON.parse(sessionStorage.getItem('aiKeyHub'));
    if (data && data.providerId) {
      const provider = providers.find(p => p.id === data.providerId);
      if (provider) {
        currentProvider = provider;
        const input = document.getElementById('apiKeyInput');
        if (input && data.key) input.value = data.key;
        selectProvider(provider.id);
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
};

// ============================================================
// UI RENDERING
// ============================================================

const renderProviderGrid = (providerList) => {
  const grid = document.getElementById('providerGrid');
  if (!grid) return;

  grid.innerHTML = providerList.map((p, index) => `
    <div class="provider-card ${currentProvider && currentProvider.id === p.id ? 'selected' : ''}"
         data-provider-id="${p.id}"
         style="animation-delay: ${index * 0.05}s"
         onclick="selectProvider('${p.id}')">
      <div class="provider-icon">${p.icon}</div>
      <div class="provider-name">${sanitizeText(p.name)}</div>
      <div class="provider-desc">${sanitizeText(p.description)}</div>
      <div class="provider-key-hint">${p.keyPrefix ? p.keyPrefix.source.replace(/[\\^$]/g, '').substring(0, 12) + '...' : 'Manual selection'}</div>
    </div>
  `).join('');
};

const updateModelSelector = () => {
  const select = document.getElementById('modelSelect');
  if (!select || !currentProvider) return;

  select.innerHTML = currentProvider.models.map(m =>
    `<option value="${m}">${m}</option>`
  ).join('');
};

const updateDetectionBadge = (detectedProviders) => {
  const badge = document.getElementById('detectionBadge');
  if (!badge) return;

  if (detectedProviders.length > 1) {
    const names = detectedProviders.map(p => p.name).join(', ');
    badge.textContent = `Multiple matches: ${names} - please select manually`;
    badge.classList.add('visible');
  } else if (detectedProviders.length === 1) {
    badge.textContent = `Detected: ${detectedProviders[0].name}`;
    badge.classList.add('visible');
  } else {
    badge.textContent = '';
    badge.classList.remove('visible');
  }
};

const updateChatHeader = () => {
  const header = document.getElementById('chatProviderName');
  if (header && currentProvider) {
    header.textContent = `Chat with ${currentProvider.name}`;
  } else if (header) {
    header.textContent = 'Select a provider to chat';
  }
};

// ============================================================
// PROVIDER SELECTION
// ============================================================

const selectProvider = (providerId) => {
  const provider = providers.find(p => p.id === providerId);
  if (!provider) return;

  currentProvider = provider;
  updateModelSelector();
  updateChatHeader();

  // Update card selection visual
  document.querySelectorAll('.provider-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.providerId === providerId);
  });

  // Show chat section
  const chatSection = document.getElementById('chatSection');
  if (chatSection) chatSection.classList.add('visible');
};

// ============================================================
// KEY VALIDATION
// ============================================================

const validateKey = async () => {
  const input = document.getElementById('apiKeyInput');
  const status = document.getElementById('validationStatus');
  if (!input || !status) return;

  const key = input.value.trim();
  if (!key) {
    status.textContent = 'Please enter an API key';
    status.className = 'status-message error';
    return;
  }

  if (!currentProvider) {
    status.textContent = 'Please select a provider first';
    status.className = 'status-message error';
    return;
  }

  status.textContent = 'Validating...';
  status.className = 'status-message info';

  try {
    let url = currentProvider.baseUrl + currentProvider.validationEndpoint;
    let options = { method: 'GET', headers: currentProvider.headers(key) };

    // Gemini: key goes in URL
    if (currentProvider.id === 'gemini') {
      url += `?key=${encodeURIComponent(key)}`;
      options.headers = { 'Content-Type': 'application/json' };
    }

    // Anthropic/Perplexity/AI21: validation via POST with minimal body
    if (currentProvider.id === 'anthropic') {
      options.method = 'POST';
      options.body = JSON.stringify({
        model: currentProvider.models[0],
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1
      });
    } else if (['perplexity', 'ai21'].includes(currentProvider.id)) {
      options.method = 'POST';
      options.body = JSON.stringify({
        model: currentProvider.models[0],
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
        stream: false
      });
    }

    const response = await fetch(url, options);

    if (response.ok) {
      status.textContent = `Key valid for ${currentProvider.name}!`;
      status.className = 'status-message success';
      saveSession();
    } else if (response.status === 401 || response.status === 403) {
      status.textContent = 'Invalid API key';
      status.className = 'status-message error';
    } else {
      status.textContent = `Validation returned status ${response.status} - key may still work`;
      status.className = 'status-message warning';
      saveSession();
    }
  } catch (err) {
    status.textContent = `Validation error: ${err.message}`;
    status.className = 'status-message error';
  }
};

// ============================================================
// CHAT - SEND MESSAGE
// ============================================================

const sendMessage = async () => {
  const input = document.getElementById('messageInput');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const chatMessages = document.getElementById('chatMessages');

  if (!input || !apiKeyInput || !chatMessages) return;

  const messageText = input.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!messageText) return;
  if (!apiKey) {
    alert('Please enter your API key first');
    return;
  }
  if (!currentProvider) {
    alert('Please select a provider first');
    return;
  }

  // Add user message
  messages.push({ role: 'user', content: messageText });
  messages = trimMessages(messages);

  // Render user message
  const userDiv = document.createElement('div');
  userDiv.className = 'message user-message';
  userDiv.innerHTML = `<strong>You:</strong> ${renderAssistantContent(messageText)}`;
  chatMessages.appendChild(userDiv);

  input.value = '';
  scrollToBottom();

  // Create assistant message placeholder
  const assistantDiv = document.createElement('div');
  assistantDiv.className = 'message assistant-message';
  assistantDiv.innerHTML = `<strong>${sanitizeText(currentProvider.name)}:</strong> <span class="response-text">...</span>`;
  chatMessages.appendChild(assistantDiv);
  scrollToBottom();

  const responseSpan = assistantDiv.querySelector('.response-text');

  // Build request
  const model = document.getElementById('modelSelect').value;
  const useStream = currentProvider.supportsStreaming;

  let url;
  let headers;
  let body;

  if (currentProvider.id === 'gemini') {
    url = `${currentProvider.baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    headers = currentProvider.headers(apiKey);
    body = currentProvider.bodyFormat(messages, model, false);
  } else {
    url = currentProvider.baseUrl + currentProvider.chatEndpoint;
    headers = currentProvider.headers(apiKey);
    body = currentProvider.bodyFormat(messages, model, useStream);
  }

  abortController = new AbortController();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: abortController.signal
    });

    if (!response.ok) {
      const errorData = await response.text();
      responseSpan.textContent = `Error ${response.status}: ${errorData.substring(0, 200)}`;
      return;
    }

    // Non-streaming (Gemini)
    if (!useStream || currentProvider.id === 'gemini') {
      const data = await response.json();
      let text = '';

      if (currentProvider.id === 'gemini') {
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      } else if (currentProvider.id === 'cohere') {
        text = data.text || 'No response';
      } else {
        text = data.choices?.[0]?.message?.content || 'No response';
      }

      responseSpan.innerHTML = renderAssistantContent(text);
      messages.push({ role: 'assistant', content: text });
      scrollToBottom();
      return;
    }

    // Streaming
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            let chunk = '';

            if (currentProvider.id === 'anthropic') {
              // Anthropic SSE: content_block_delta
              if (parsed.type === 'content_block_delta') {
                chunk = parsed.delta?.text || '';
              }
            } else if (currentProvider.id === 'cohere') {
              chunk = parsed.text || '';
            } else {
              // OpenAI-compatible format
              chunk = parsed.choices?.[0]?.delta?.content || '';
            }

            if (chunk) {
              fullText += chunk;
              responseSpan.innerHTML = renderAssistantContent(fullText);
              scrollToBottom();
            }
          } catch (e) {
            // Skip unparseable lines
          }
        } else if (line.startsWith('event: ')) {
          // Handle Anthropic event types
          continue;
        }
      }
    }

    messages.push({ role: 'assistant', content: fullText });
  } catch (err) {
    if (err.name === 'AbortError') {
      responseSpan.textContent = '[Message cancelled]';
    } else {
      responseSpan.textContent = `Error: ${err.message}`;
    }
  }
};

// ============================================================
// EVENT LISTENERS
// ============================================================

const stopGeneration = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
};

const clearChat = () => {
  messages = [];
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) chatMessages.innerHTML = '';
};

const initApp = () => {
  // Render initial provider grid
  renderProviderGrid(providers);

  // Provider search
  const searchInput = document.getElementById('providerSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const results = searchProviders(e.target.value);
      renderProviderGrid(results);
    });
  }

  // Key input detection
  const apiKeyInput = document.getElementById('apiKeyInput');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', (e) => {
      const detected = detectProvider(e.target.value);
      updateDetectionBadge(detected);
      if (detected.length === 1) {
        selectProvider(detected[0].id);
      }
    });
  }

  // Send button
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  // Validate button
  const validateBtn = document.getElementById('validateBtn');
  if (validateBtn) {
    validateBtn.addEventListener('click', validateKey);
  }

  // Stop button
  const stopBtn = document.getElementById('stopBtn');
  if (stopBtn) {
    stopBtn.addEventListener('click', stopGeneration);
  }

  // Clear button
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearChat);
  }

  // Keyboard shortcuts
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Load session
  loadSession();
};

document.addEventListener('DOMContentLoaded', initApp);
