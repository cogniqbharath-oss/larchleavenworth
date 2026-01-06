document.addEventListener('DOMContentLoaded', () => {
    
    // Mobile Nav Toggle (Simple Implementation)
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('nav');
    
    // Chatbot Logic
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // Toggle Chat Window
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.add('active');
        chatToggle.style.display = 'none'; // Optional hide
    });

    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('active');
        setTimeout(() => {
            chatToggle.style.display = 'flex';
        }, 300);
    });

    // Send Message
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Add User Message
        addMessage(text, 'user');
        userInput.value = '';

        // Add Loading Indicator (optional)
        const loadingId = addLoading();

        try {
            // Replace with your actual Cloudflare Worker URL
            const workerUrl = 'https://flat-mountain-27a4.cogniq-bharath.workers.dev/'; 

            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            // Remove Loading
            removeLoading(loadingId);
            
            // Add Bot Response
            // Assuming the worker returns { response: "text" }
            addMessage(data.response || "I didn't quite catch that.", 'bot');

        } catch (error) {
            console.error('Error:', error);
            removeLoading(loadingId);
            addMessage("Sorry, I'm having trouble connecting to the kitchen right now. Please try again later.", 'bot');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.innerText = text; // Safe text insertion
        
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addLoading() {
        const id = 'loading-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'bot');
        msgDiv.id = id;
        
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.style.fontStyle = 'italic';
        bubble.style.opacity = '0.7';
        bubble.innerText = 'Typing...';
        
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
