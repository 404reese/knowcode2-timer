import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { socket } from "../socket";

const Admin = () => {
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;
  const [phases, setPhases] = useState([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseRemaining, setPhaseRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [newEventText, setNewEventText] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [editablePhases, setEditablePhases] = useState([]);
  const [customAlertText, setCustomAlertText] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Live state pushed from the server over the socket (no more polling)
  const lastPhasesSignatureRef = useRef("");
  useEffect(() => {
    const handleState = (state) => {
      setPhases(state.phases);
      // Only reseed the phase editor when the phase list itself changed
      // (label/duration/count), not on every per-second tick — otherwise
      // in-progress edits would get wiped out every second.
      const signature = JSON.stringify(state.phases);
      if (signature !== lastPhasesSignatureRef.current) {
        lastPhasesSignatureRef.current = signature;
        setEditablePhases(state.phases.map((p) => ({ ...p })));
      }
      setCurrentPhaseIndex(state.currentPhaseIndex);
      setPhaseRemaining(state.phaseRemaining);
      setIsRunning(state.isRunning);
      setMessage(state.message);
      setAnnouncement(state.announcement);
      setUpcomingEvents(state.upcomingEvents || []);
    };

    socket.on("state", handleState);
    return () => socket.off("state", handleState);
  }, []);

  // Adjust the remaining time of the currently active phase
  const setTimerTo = async (newValue) => {
    try {
      await axios.post(`${API_BASE_URL}/timer`, { newValue: Math.max(0, newValue) });
    } catch (error) {
      console.error("Error updating timer:", error);
    }
  };

  const updateTimerValue = async () => {
    const newValue = parseInt(inputValue, 10);
    if (!isNaN(newValue) && newValue >= 0) {
      await setTimerTo(newValue);
      setInputValue("");
    } else {
      alert("Please enter a valid number.");
    }
  };

  const adjustTimerByMinutes = (minutes) => {
    setTimerTo(phaseRemaining + minutes * 60);
  };

  const resetCurrentPhase = () => {
    const phase = phases[currentPhaseIndex];
    if (phase) setTimerTo(phase.duration);
  };

  const toggleTimer = async () => {
    try {
      await axios.post(`${API_BASE_URL}/timer/play-pause`);
    } catch (error) {
      console.error("Error toggling timer:", error);
    }
  };

  const advancePhase = async () => {
    try {
      await axios.post(`${API_BASE_URL}/phases/advance`);
    } catch (error) {
      console.error("Error advancing phase:", error);
    }
  };

  const jumpToPhase = async (index) => {
    try {
      await axios.post(`${API_BASE_URL}/phases/jump`, { index });
    } catch (error) {
      console.error("Error jumping to phase:", error);
    }
  };

  // ---- Phase editor (label + duration for each milestone) ----
  const updateEditablePhase = (index, field, value) => {
    setEditablePhases((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const addPhaseRow = () => {
    setEditablePhases((prev) => [...prev, { label: "New Phase", duration: 600 }]);
  };

  const removePhaseRow = (index) => {
    setEditablePhases((prev) => prev.filter((_, i) => i !== index));
  };

  const savePhases = async () => {
    const cleaned = editablePhases
      .map((p) => ({ ...p, label: (p.label || "").trim(), duration: Number(p.duration) }))
      .filter((p) => p.label && !isNaN(p.duration) && p.duration >= 0);

    if (cleaned.length === 0) {
      alert("Add at least one valid phase (label + duration in seconds).");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/phases`, { phases: cleaned });
    } catch (error) {
      console.error("Error saving phases:", error);
    }
  };

  const updateMessage = async () => {
    try {
      await axios.post(`${API_BASE_URL}/message`, { newMessage });
      setNewMessage("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const updateAnnouncement = async () => {
    try {
      await axios.post(`${API_BASE_URL}/announcement`, { newAnnouncement });
      setNewAnnouncement("");
    } catch (error) {
      console.error("Error updating announcement:", error);
    }
  };

  const addEvent = async () => {
    try {
      if (newEventText && newEventDate) {
        await axios.post(`${API_BASE_URL}/upcoming-events`, {
          text: newEventText,
          date: newEventDate
        });
        setNewEventText("");
        setNewEventDate("");
      } else {
        alert("Please enter both text and date for the event.");
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/upcoming-events/${id}`);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  // Broadcast a sound + visual alert to every connected Display/Countdown screen
  const sendAlert = async (type, text) => {
    try {
      await axios.post(`${API_BASE_URL}/alert`, { type, text });
    } catch (error) {
      console.error("Error sending alert:", error);
    }
  };

  const sendCustomAlert = () => {
    if (!customAlertText.trim()) {
      alert("Enter an alert message first.");
      return;
    }
    sendAlert("custom", customAlertText.trim());
    setCustomAlertText("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "reese" && password === "reese") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid credentials!");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      {!isAuthenticated ? (
        <div>
          <h1>Admin Login</h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: "5px", width: "200px" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "5px", width: "200px" }}
            />
            <button type="submit" style={{ padding: "5px 20px" }}>Login</button>
          </form>
        </div>
      ) : (
        <>
          <h1>Admin Control</h1>

          <div style={{ marginTop: "20px" }}>
            <h2>Remaining: {phaseRemaining} seconds</h2>
            <button onClick={toggleTimer} style={{ margin: "10px" }}>
              {isRunning ? "Pause" : "Play"}
            </button>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", margin: "10px" }}>
              <button onClick={() => adjustTimerByMinutes(-5)}>-5 min</button>
              <button onClick={() => adjustTimerByMinutes(5)}>+5 min</button>
              <button onClick={resetCurrentPhase}>Reset Current Phase</button>
              <button onClick={advancePhase} disabled={currentPhaseIndex >= phases.length - 1}>
                Skip to Next Phase
              </button>
            </div>
            <div>
              <input
                type="number"
                placeholder="Enter new timer value (seconds)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ margin: "10px" }}
              />
              <button onClick={updateTimerValue}>Update Timer</button>
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h2>Timer Phases / Milestones</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
              {phases.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => jumpToPhase(i)}
                  style={{
                    fontWeight: i === currentPhaseIndex ? "bold" : "normal",
                    outline: i === currentPhaseIndex ? "2px solid dodgerblue" : "none"
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              {editablePhases.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: "5px", marginBottom: "5px", justifyContent: "center" }}>
                  <input
                    type="text"
                    placeholder="Label"
                    value={p.label}
                    onChange={(e) => updateEditablePhase(i, "label", e.target.value)}
                    style={{ width: "160px" }}
                  />
                  <input
                    type="number"
                    placeholder="Duration (seconds)"
                    value={p.duration}
                    onChange={(e) => updateEditablePhase(i, "duration", e.target.value)}
                    style={{ width: "160px" }}
                  />
                  <button onClick={() => removePhaseRow(i)} style={{ backgroundColor: "red", color: "white", border: "none" }}>
                    Remove
                  </button>
                </div>
              ))}
              <div style={{ marginTop: "10px" }}>
                <button onClick={addPhaseRow}>+ Add Phase</button>
                <button onClick={savePhases} style={{ marginLeft: "10px" }}>
                  Save Phases (restarts at Phase 1)
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h2>Message: {message}</h2>
            <input
              type="text"
              placeholder="Enter new message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ margin: "10px", width: "300px" }}
            />
            <button onClick={updateMessage}>Update Message</button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h2>Announcement: {announcement}</h2>
            <input
              type="text"
              placeholder="Enter new announcement"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              style={{ margin: "10px", width: "300px" }}
            />
            <button onClick={updateAnnouncement}>Update Announcement</button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h2>Send Alert to All Screens</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
              <button onClick={() => sendAlert("ding", "Ding! Please check in.")}>Ding</button>
              <button onClick={() => sendAlert("meal", "Meal is ready — head to the cafeteria!")}>Meal Call</button>
              <button onClick={() => sendAlert("submission", "Submission deadline approaching!")}>Submission Warning</button>
            </div>
            <input
              type="text"
              placeholder="Custom alert message"
              value={customAlertText}
              onChange={(e) => setCustomAlertText(e.target.value)}
              style={{ margin: "10px", width: "300px" }}
            />
            <button onClick={sendCustomAlert}>Send Custom Alert</button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h2>Upcoming Events</h2>
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Event Text"
                value={newEventText}
                onChange={(e) => setNewEventText(e.target.value)}
                style={{ margin: "5px", width: "200px" }}
              />
              <input
                type="datetime-local"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                style={{ margin: "5px" }}
              />
              <button onClick={addEvent}>Add Event</button>
            </div>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {upcomingEvents.map((event) => (
                <li key={event.id} style={{ marginBottom: "10px", borderBottom: "1px solid #ccc", paddingBottom: "5px" }}>
                  <strong>{event.text}</strong> - {new Date(event.date).toLocaleString()}
                  <button onClick={() => deleteEvent(event.id)} style={{ marginLeft: "10px", backgroundColor: "red", color: "white", border: "none", cursor: "pointer" }}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Admin;
