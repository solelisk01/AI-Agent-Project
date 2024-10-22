const participantID = localStorage.getItem('participantID');

if (!participantID) {
    alert('Please enter a participant ID.');
    window.location.href = '/';
}

async function loadConversationHistory() {
    const response = await fetch('/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantID })
    });
    const data = await response.json();
    if (data.interactions && data.interactions.length > 0) {
        data.interactions.forEach(interaction => {
            const userMessageDiv = document.createElement('div');
            userMessageDiv.textContent = `You: ${interaction.userInput}`;
            document.getElementById('messages').appendChild(userMessageDiv);
            const botMessageDiv = document.createElement('div');
            botMessageDiv.textContent = `Bot: ${interaction.botResponse}`;
            document.getElementById('messages').appendChild(botMessageDiv);
            conversationHistory.push({ role: 'user', content: interaction.userInput });
            conversationHistory.push({ role: 'assistant', content: interaction.botResponse });
        });
    }
}

window.onload = loadConversationHistory;

document.getElementById('submit').addEventListener('click', () => {
    logEvent('click', 'Send Button');
});

document.getElementById('chat-container').addEventListener('mouseover', () => {
    logEvent('hover', 'User Input');
});

document.getElementById('chat-container').addEventListener('focus', () => {
    logEvent('focus', 'User Input');
});

function logEvent(type, element) {
    fetch('/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: type, elementName: element, timestamp: new Date() })
    });
}

const inputField = document.getElementById("user-input");
const chatForm = document.getElementById("chat-form");
const messagesContainer = document.getElementById("messages");

chatForm.addEventListener("submit", sendMessage);

let conversationHistory = [];

async function sendMessage(event) {
    event.preventDefault();

    const userInput = inputField.value.trim();

    if (userInput === "") {
        alert("Please enter a message!");
        return;
    }

    messagesContainer.innerHTML += `<div class="message user-message">You: ${userInput}</div>`;

    inputField.value = "";

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    console.log("User:", userInput);

    try {
        const payload = conversationHistory.length === 0
            ? { input: userInput, participantID }
            : { history: conversationHistory, input: userInput, participantID };

        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        conversationHistory.push({ role: 'user', content: userInput });
        conversationHistory.push({ role: 'assistant', content: data.botResponse });

        messagesContainer.innerHTML += `<div class="message bot-message">Bot: ${data.botResponse}</div>`;

        messagesContainer.innerHTML += `<div class="message bot-message">Bing Search:</div>`;
        if (data.searchResults && data.searchResults.length > 0) {
            const searchResultsDiv = document.createElement('div');
            data.searchResults.forEach(result => {
                const resultDiv = document.createElement('div');
                resultDiv.innerHTML = `<a href="${result.url}" target="_blank">${result.title}</a><p>${result.snippet}</p>`;
                searchResultsDiv.appendChild(resultDiv);
            });
            document.getElementById('messages').appendChild(searchResultsDiv);
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error("Error:", error);
    }
}
