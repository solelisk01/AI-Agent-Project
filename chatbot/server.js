const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');

require('dotenv').config();

const app = express();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const Interaction = require('./models/Interaction');
const EventLog = require('./models/EventLog');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chatbot', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

app.post('/history', async (req, res) => {
    const { participantID } = req.body;
    if (!participantID) {
        return res.status(400).send('Participant ID is required');
    }
    try {
        const interactions = await Interaction.find({ participantID }).sort({ timestamp: 1 });
        res.json({ interactions });
    } catch (error) {
        console.error('Error fetching conversation history:', error.message);
        res.status(500).send('Server Error');
    }
});

app.post('/submit', async (req, res) => {
    const { history = [], input: userInput, participantID } = req.body;

    if (!userInput || !participantID) {
        return res.status(400).json({ error: 'Invalid input or Participant ID is required' });
    }

    try {
        const messages = history.length === 0
            ? [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: userInput }]
            : [{ role: 'system', content: 'You are a helpful assistant.' }, ...history, { role: 'user', content: userInput }];

        const openaiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 500,
        });

        const botResponse = openaiResponse.choices[0].message.content.trim();

        const bingResponse = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
            params: { q: userInput },
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY
            }
        });

        const searchResults = bingResponse.data.webPages.value.slice(0, 3).map(result => ({
            title: result.name,
            url: result.url,
            snippet: result.snippet
        }));

        const interaction = new Interaction({
            userInput: userInput,
            botResponse: botResponse,
            participantID: participantID
        });
        await interaction.save();

        res.json({ botResponse, searchResults });

    } catch (error) {
        console.error('Error with OpenAI or Bing API:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/log-event', async (req, res) => {
    const { eventType, elementName, timestamp, participantID } = req.body;

    if (!participantID) {
        return res.status(400).send('Participant ID is required');
    }

    try {
        const event = new EventLog({
            eventType,
            elementName,
            timestamp,
            participantID
        });
        await event.save();
        res.status(200).send('Event logged successfully');
    } catch (error) {
        console.error('Error logging event:', error.message);
        res.status(500).send('Server Error');
    }
});

app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
