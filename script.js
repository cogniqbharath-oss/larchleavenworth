document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('nav');
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    // --- State ---
    let leadCaptureState = 'idle'; // idle, asking_name, asking_contact
    let userDetails = { name: '', contact: '' };
    let messageCount = 0;

    // --- Configuration ---
    const workerUrl = 'https://flat-mountain-27a4.cogniq-bharath.workers.dev/';
    const foodImages = {
        'pasta': ['assets/chef_pasta.jpg', 'assets/pasta.png'],
        'cocktails': ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=300&auto=format&fit=crop'],
        'interior': ['assets/interior.png'],
        'specials': ['assets/steak_dish.jpg', 'assets/arancini_salad.jpg']
    };

    // --- Initialization ---
    initChat();

    function initChat() {
        // Clear existing messages if any (for clear chat function)
        chatMessages.innerHTML = '';

        // Add Greeting based on time
        const greeting = getGreeting();
        addMessage(greeting, 'bot');

        // Add Suggestion Chips
        addSuggestions();
    }

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning! ☀️ Craving a handcrafted brunch or coffee?";
        if (hour < 17) return "Good afternoon! 🍝 Join us for a late lunch or early handcrafted pasta?";
        return "Good evening! 🍷 Ready for cocktails and dinner at Larch?";
    }

    // --- Event Listeners ---
    if (chatToggle) {
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.add('active');
            chatToggle.style.display = 'none';
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatWindow.classList.remove('active');
            setTimeout(() => {
                chatToggle.style.display = 'flex';
            }, 300);
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // --- Core Logic ---
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // handle simple clear command
        if (text.toLowerCase() === '/clear') {
            userInput.value = '';
            initChat();
            return;
        }

        addMessage(text, 'user');
        userInput.value = '';
        messageCount++;

        // Lead Capture Flow intercept
        if (leadCaptureState === 'asking_name') {
            userDetails.name = text;
            leadCaptureState = 'asking_contact';
            setTimeout(() => addMessage(`Nice to meet you, ${text}! What's the best phone number or email to reach you at if we need to follow up?`, 'bot'), 600);
            return;
        }
        if (leadCaptureState === 'asking_contact') {
            userDetails.contact = text;
            leadCaptureState = 'completed';
            setTimeout(() => addMessage("Perfect, thanks! I've noted that down. How else can I help you today?", 'bot'), 600);
            console.log("Lead Captured:", userDetails); // In a real app, send to backend
            return;
        }

        // Show Typing Indicator
        const loadingId = addLoading();

        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            if (!response.ok) throw new Error('Network error');
            const data = await response.json();

            removeLoading(loadingId);
            processBotResponse(data.response);

        } catch (error) {
            console.error(error);
            removeLoading(loadingId);
            addMessage("I'm having a bit of trouble connecting to the kitchen. Please try again or call us!", 'bot');
        }
    }

    function processBotResponse(response) {
        // 1. Text Response
        let text = response;

        // 2. Extract and Handle Custom Tags (Images, CTAs)
        // Format: [SHOW_IMAGES: pasta]
        const imageTag = text.match(/\[SHOW_IMAGES:\s*(\w+)\]/);
        if (imageTag) {
            const category = imageTag[1].toLowerCase();
            text = text.replace(imageTag[0], ''); // Remove tag from text
            addMessage(text, 'bot');
            showImages(category);
            return;
        }

        addMessage(text, 'bot');

        // 3. Trigger Lead Capture randomly after 3-4 interactions if not done
        if (leadCaptureState === 'idle' && messageCount > 3 && Math.random() > 0.5) {
            setTimeout(() => {
                leadCaptureState = 'asking_name';
                addMessage("By the way, in case we get disconnected or you'd like to book for a large group, what's your name?", 'bot');
            }, 2000);
        }
    }

    // --- UI Helpers ---
    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.textContent = text;

        const time = document.createElement('span');
        time.classList.add('timestamp');
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        msgDiv.appendChild(bubble);
        msgDiv.appendChild(time);

        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function addSuggestions() {
        const chipsDiv = document.createElement('div');
        chipsDiv.classList.add('suggestion-chips');

        suggestions.forEach(s => {
            const chip = document.createElement('button');
            chip.classList.add('chip');
            chip.textContent = s;
            chip.onclick = () => {
                userInput.value = `Tell me about your ${s}`;
                sendMessage();
            };
            chipsDiv.appendChild(chip);
        });

        // Add Clean Chat button logic roughly here or in header, but for now append to msg area
        // or just use /clear. Let's add a clear button to header in HTML usually, but here dynamic:
        // Checking task: "Clear Chat Option". Let's add a small link at bottom or header.
        // For this function, just chips.
        chatMessages.appendChild(chipsDiv);
        scrollToBottom();
    }

    function showImages(category) {
        // Fallback to 'pasta' if unknown
        const images = foodImages[category] || foodImages['pasta'];

        const galleryDiv = document.createElement('div');
        galleryDiv.classList.add('message', 'bot', 'gallery');

        images.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.classList.add('chat-image');
            img.onclick = () => window.open(src, '_blank');
            galleryDiv.appendChild(img);
        });

        chatMessages.appendChild(galleryDiv);
        scrollToBottom();
    }

    function addLoading() {
        const id = 'loading-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'bot', 'typing-indicator');
        msgDiv.id = id;

        msgDiv.innerHTML = `
            <div class="bubble">
                <span></span><span></span><span></span>
            </div>
        `;

        chatMessages.appendChild(msgDiv);
        scrollToBottom();
        return id;
    }

    function removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add Clear Button to Header dynamically if not present
    if (!document.querySelector('#clearChat')) {
        const header = document.querySelector('.chat-header');
        const clearBtn = document.createElement('div');
        clearBtn.id = 'clearChat';
        clearBtn.title = 'Clear Chat';
        clearBtn.innerHTML = '<i class="fas fa-trash"></i>';
        clearBtn.style.cursor = 'pointer';
        clearBtn.style.marginRight = '10px';
        clearBtn.style.opacity = '0.7';
        clearBtn.onclick = initChat;

        // Insert before close button
        header.insertBefore(clearBtn, chatClose);
    }

});
