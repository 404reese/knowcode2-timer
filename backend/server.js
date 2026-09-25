const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// ---- Persistence ----
const DATA_FILE = path.join(__dirname, "data.json");

const defaultState = {
  // Ordered timer phases. Each phase counts down independently; when one
  // hits zero the next phase starts automatically.
  phases: [
    { id: 1, label: "Hacking", duration: 28800 }, // 8 hours
    { id: 2, label: "Judging", duration: 5400 }, // 1.5 hours
    { id: 3, label: "Submission Deadline", duration: 900 }, // 15 minutes
  ],
  currentPhaseIndex: 0,
  phaseRemaining: 28800,
  isRunning: false,
  message: "Prepare for the next 8 hours of chaos",
  announcement: "Hold on to your keyboards",
  upcomingEvents: [
    { id: 1, text: "Start Coding", date: "2026-09-26T08:00" },
    { id: 2, text: "Mentoring Round", date: "2026-09-26T11:00" }
  ]
};

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      const merged = { ...defaultState, ...parsed };
      // Guard against stale/partial phase data from older saves.
      if (!Array.isArray(merged.phases) || merged.phases.length === 0) {
        merged.phases = defaultState.phases;
        merged.currentPhaseIndex = 0;
        merged.phaseRemaining = merged.phases[0].duration;
      }
      return merged;
    }
  } catch (error) {
    console.error("Error loading persisted state, falling back to defaults:", error);
  }
  return { ...defaultState };
}

function saveState() {
  const state = { phases, currentPhaseIndex, phaseRemaining, isRunning, message, announcement, upcomingEvents };
  fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), (error) => {
    if (error) console.error("Error saving state:", error);
  });
}

const initialState = loadState();
let phases = initialState.phases;
let currentPhaseIndex = initialState.currentPhaseIndex;
let phaseRemaining = initialState.phaseRemaining;
let isRunning = initialState.isRunning;
let message = initialState.message;
let announcement = initialState.announcement;
let upcomingEvents = initialState.upcomingEvents;

function getPublicState() {
  return {
    phases,
    currentPhaseIndex,
    currentPhase: phases[currentPhaseIndex] || null,
    phaseRemaining,
    isRunning,
    isComplete: currentPhaseIndex >= phases.length - 1 && phaseRemaining <= 0,
    message,
    announcement,
    upcomingEvents,
  };
}

function broadcastState() {
  io.emit("state", getPublicState());
}

// Timer logic: decrement the active phase every second if running, and
// auto-advance to the next phase (or stop) once it hits zero.
setInterval(() => {
  if (!isRunning) return;

  if (phaseRemaining > 0) {
    phaseRemaining--;
  } else if (currentPhaseIndex < phases.length - 1) {
    currentPhaseIndex++;
    phaseRemaining = phases[currentPhaseIndex].duration;
    io.emit("alert", {
      type: "phase-change",
      text: `${phases[currentPhaseIndex].label} has begun`,
    });
  } else {
    isRunning = false;
  }

  broadcastState();

  if (phaseRemaining % 10 === 0) {
    saveState();
  }
}, 1000);

io.on("connection", (socket) => {
  socket.emit("state", getPublicState());

  socket.on("disconnect", () => {});
});

// ---- REST API (mutations; state pushed to clients over the socket) ----

// Get the current full state
app.get("/api/state", (req, res) => {
  res.json(getPublicState());
});

// Backward-compatible flat timer endpoint (current phase's remaining time)
app.get("/api/timer", (req, res) => {
  res.json({ timerValue: phaseRemaining, isRunning });
});

// Adjust the remaining time of the currently active phase
app.post("/api/timer", (req, res) => {
  const { newValue } = req.body;
  if (typeof newValue === "number" && newValue >= 0) {
    phaseRemaining = newValue;
    saveState();
    broadcastState();
    res.json({ message: "Timer updated successfully." });
  } else {
    res.status(400).json({ message: "Invalid timer value." });
  }
});

// Toggle play/pause
app.post("/api/timer/play-pause", (req, res) => {
  isRunning = !isRunning;
  saveState();
  broadcastState();
  res.json({ message: isRunning ? "Timer started." : "Timer paused." });
});

// ---- Phases ----

// Get all phases plus current progress
app.get("/api/phases", (req, res) => {
  res.json({ phases, currentPhaseIndex, phaseRemaining, isRunning });
});

// Replace the full phase list and restart at phase 0
app.post("/api/phases", (req, res) => {
  const { phases: newPhases } = req.body;
  if (
    Array.isArray(newPhases) &&
    newPhases.length > 0 &&
    newPhases.every((p) => p && typeof p.label === "string" && typeof p.duration === "number" && p.duration >= 0)
  ) {
    phases = newPhases.map((p, i) => ({ id: p.id ?? Date.now() + i, label: p.label, duration: p.duration }));
    currentPhaseIndex = 0;
    phaseRemaining = phases[0].duration;
    isRunning = false;
    saveState();
    broadcastState();
    res.json({ message: "Phases updated successfully.", phases });
  } else {
    res.status(400).json({ message: "Invalid phases payload." });
  }
});

// Manually advance to the next phase (skips remaining time in current one)
app.post("/api/phases/advance", (req, res) => {
  if (currentPhaseIndex < phases.length - 1) {
    currentPhaseIndex++;
    phaseRemaining = phases[currentPhaseIndex].duration;
    saveState();
    broadcastState();
    io.emit("alert", { type: "phase-change", text: `${phases[currentPhaseIndex].label} has begun` });
    res.json({ message: "Advanced to next phase.", currentPhaseIndex });
  } else {
    res.status(400).json({ message: "Already on the final phase." });
  }
});

// Jump to a specific phase index, restarting its duration
app.post("/api/phases/jump", (req, res) => {
  const { index } = req.body;
  if (typeof index === "number" && index >= 0 && index < phases.length) {
    currentPhaseIndex = index;
    phaseRemaining = phases[index].duration;
    saveState();
    broadcastState();
    res.json({ message: "Jumped to phase.", currentPhaseIndex });
  } else {
    res.status(400).json({ message: "Invalid phase index." });
  }
});

// Get the current message
app.get("/api/message", (req, res) => {
  res.json({ message });
});

// Update the message
app.post("/api/message", (req, res) => {
  const { newMessage } = req.body;
  if (typeof newMessage === "string") {
    message = newMessage;
    saveState();
    broadcastState();
    res.json({ message: "Message updated successfully." });
  } else {
    res.status(400).json({ message: "Invalid message." });
  }
});

// announce section
// Get the current announcement
app.get("/api/announcement", (req, res) => {
  res.json({ announcement });
});

// Update the announcement
app.post("/api/announcement", (req, res) => {
  const { newAnnouncement } = req.body;
  if (typeof newAnnouncement === "string") {
    announcement = newAnnouncement;
    saveState();
    broadcastState();
    res.json({ message: "Announcement updated successfully." });
  } else {
    res.status(400).json({ message: "Invalid announcement." });
  }
});

// ---- Alerts (pushed live to all Display/Countdown screens) ----
app.post("/api/alert", (req, res) => {
  const { type, text } = req.body;
  if (typeof text !== "string" || !text) {
    return res.status(400).json({ message: "Invalid alert. 'text' is required." });
  }
  io.emit("alert", { type: type || "custom", text });
  res.json({ message: "Alert broadcast." });
});

// Upcoming Events Section
// Get all upcoming events
app.get("/api/upcoming-events", (req, res) => {
  res.json({ events: upcomingEvents });
});

// Add a new upcoming event
app.post("/api/upcoming-events", (req, res) => {
  const { text, date } = req.body;
  if (text && date) {
    const newEvent = {
      id: Date.now(), // Simple ID generation
      text,
      date
    };
    upcomingEvents.push(newEvent);
    saveState();
    broadcastState();
    res.json({ message: "Event added successfully.", event: newEvent });
  } else {
    res.status(400).json({ message: "Invalid event data. Text and Date are required." });
  }
});

// Delete an upcoming event
app.delete("/api/upcoming-events/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = upcomingEvents.length;
  upcomingEvents = upcomingEvents.filter(event => event.id != id);

  if (upcomingEvents.length < initialLength) {
    saveState();
    broadcastState();
    res.json({ message: "Event deleted successfully." });
  } else {
    res.status(404).json({ message: "Event not found." });
  }
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Persist state on shutdown so a manual stop doesn't lose the latest tick
process.on("SIGINT", () => {
  saveState();
  process.exit(0);
});
process.on("SIGTERM", () => {
  saveState();
  process.exit(0);
});
