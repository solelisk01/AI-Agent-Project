const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Interaction Schema
const InteractionSchema = new Schema({
    participantID: String, // Track the participant's ID
    userInput: String, // Store the user's message
    botResponse: String, // Store the bot's response
    timestamp: { type: Date, default: Date.now } // Log the time of interaction
});

// Event Log Schema
const EventLogSchema = new Schema({
    participantID: String, // Track the participant's ID
    eventType: String, // Type of event (click, hover, focus, etc.)
    elementName: String, // Name of the UI element
    timestamp: { type: Date, default: Date.now } // Log the time of the event
});

module.exports = {
    Interaction: mongoose.model('Interaction', InteractionSchema),
    EventLog: mongoose.model('EventLog', EventLogSchema)
};
