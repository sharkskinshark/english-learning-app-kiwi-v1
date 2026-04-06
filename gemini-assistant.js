/**
 * Gemini AI Assistant Widget
 * Provides a floating glassmorphism chat interface for English learning support.
 */

(function initGeminiAssistant() {
    console.log("🪄 Gemini AI Assistant Initialized");

    // ==========================================
    // 1. UI Elements Creation
    // ==========================================
    function createUI() {
        // Floating Toggle Button
        const btn = document.createElement('button');
        btn.id = 'geminiToggleBtn';
        btn.className = 'gemini-btn';
        btn.innerHTML = '🪄 Gemini AI';
        btn.style.position = 'fixed';
        btn.style.bottom = '80px'; // Above the Kiwi button
        btn.style.right = '20px';
        btn.style.zIndex = '10001';
        btn.onclick = toggleAssistant;
        document.body.appendChild(btn);

        // Assistant Drawer (Glassmorphism)
        const drawer = document.createElement('div');
        drawer.id = 'geminiDrawer';
        drawer.style.cssText = `
            position: fixed;
            top: 20px;
            right: -450px;
            width: 400px;
            height: calc(100vh - 40px);
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            border: 1px solid rgba(44, 42, 41, 0.1);
            border-radius: 24px;
            box-shadow: -10px 0 40px rgba(0,0,0,0.05);
            z-index: 10002;
            transition: right 0.5s cubic-bezier(0.19, 1, 0.22, 1);
            display: flex;
            flex-direction: column;
            padding: 24px;
            overflow: hidden;
        `;

        drawer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; font-family: 'Playfair Display', serif; font-weight: 400; letter-spacing: 0.1em;">Gemini Assistant</h3>
                <button onclick="window.toggleAssistant()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--zen-ink);">×</button>
            </div>
            <div id="geminiChatLog" style="flex: 1; overflow-y: auto; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; padding-right: 8px;">
                <div class="msg ai" style="background: rgba(44, 42, 41, 0.05); padding: 12px 16px; border-radius: 16px; align-self: flex-start; max-width: 85%; font-size: 0.95rem;">
                    Hello! I am your Gemini AI assistant. How can I help you with your English learning today?
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <input type="text" id="geminiInput" placeholder="Ask anything..." style="flex: 1; min-width: 0; border-radius: 12px; padding: 12px 16px; background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(44, 42, 41, 0.1);">
                <button id="sendGeminiBtn" style="border-radius: 12px; padding: 0 16px; background: var(--zen-ink); color: white; border: none; cursor: pointer;">Send</button>
            </div>
            <div style="margin-top: 12px; font-size: 0.75rem; color: #888; text-align: center;">
                Powered by Google Gemini 1.5
            </div>
        `;

        document.body.appendChild(drawer);

        // Events
        const input = drawer.querySelector('#geminiInput');
        const sendBtn = drawer.querySelector('#sendGeminiBtn');
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
        sendBtn.onclick = sendMessage;
    }

    function toggleAssistant() {
        const drawer = document.getElementById('geminiDrawer');
        if (drawer) {
            const isOpen = drawer.style.right === '20px';
            drawer.style.right = isOpen ? '-450px' : '20px';
        }
    }
    window.toggleAssistant = toggleAssistant;

    function sendMessage() {
        const input = document.getElementById('geminiInput');
        const log = document.getElementById('geminiChatLog');
        const text = input.value.trim();
        if (!text) return;

        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'msg user';
        userMsg.style.cssText = 'background: var(--zen-ink); color: white; padding: 12px 16px; border-radius: 16px; align-self: flex-end; max-width: 85%; font-size: 0.95rem;';
        userMsg.textContent = text;
        log.appendChild(userMsg);
        input.value = '';
        log.scrollTop = log.scrollHeight;

        // Mock AI response for now (would connect to API here)
        setTimeout(() => {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'msg ai';
            aiMsg.style.cssText = 'background: rgba(44, 42, 41, 0.05); padding: 12px 16px; border-radius: 16px; align-self: flex-start; max-width: 85%; font-size: 0.95rem;';
            aiMsg.innerHTML = `Thinking about "<i>${text}</i>"... <br><br>這是一個很好的問題！作為 Gemini AI，我可以協助您分析拼字錯誤或是解釋文法。待 API 金鑰配置完成後，我將能提供即時的智慧型回應。`;
            log.appendChild(aiMsg);
            log.scrollTop = log.scrollHeight;
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})();
