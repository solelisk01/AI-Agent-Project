const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Event Log Schema
const EventLogSchema = new Schema({
    participantID: String, // Track the participant's ID
    eventType: String, // Type of event (click, hover, focus)
    elementName: String, // Name of the element (e.g., SendButton)
    timestamp: { type: Date, default: Date.now } // Log the time of the event
});

// Export the EventLog model
module.exports = mongoose.model('EventLog', EventLogSchema);
