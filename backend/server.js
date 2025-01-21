const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let timerValue = 129600; // Initial timer value in seconds
let isRunning = false;

// Timer logic: decrement timer every second if running
setInterval(() => {
  if (isRunning && timerValue > 0) {
    timerValue--;
  }
}, 1000);

// Get the current timer value and state
app.get("/api/timer", (req, res) => {
  res.json({ timerValue, isRunning });
});

// Update the timer value
app.post("/api/timer", (req, res) => {
  const { newValue } = req.body;
  if (typeof newValue === "number" && newValue >= 0) {
    timerValue = newValue;
    res.json({ message: "Timer updated successfully." });
  } else {
    res.status(400).json({ message: "Invalid timer value." });
  }
});

// Toggle play/pause
app.post("/api/timer/play-pause", (req, res) => {
  isRunning = !isRunning;
  res.json({ message: isRunning ? "Timer started." : "Timer paused." });
});

// Start the server on port 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


let message = "Prepare for the next 36 hours of chaos"; // Default message

// Get the current message
app.get("/api/message", (req, res) => {
  res.json({ message });
});

// Update the message
app.post("/api/message", (req, res) => {
  const { newMessage } = req.body;
  if (typeof newMessage === "string") {
    message = newMessage;
    res.json({ message: "Message updated successfully." });
  } else {
    res.status(400).json({ message: "Invalid message." });
  }
});

// announce section
let announcement = "Hold on to your keyboards"; // Default announcement

// Get the current announcement
app.get("/api/announcement", (req, res) => {
  res.json({ announcement });
});

// Update the announcement
app.post("/api/announcement", (req, res) => {
  const { newAnnouncement } = req.body;
  if (typeof newAnnouncement === "string") {
    announcement = newAnnouncement;
    res.json({ message: "Announcement updated successfully." });
  } else {
    res.status(400).json({ message: "Invalid announcement." });
  }
});
