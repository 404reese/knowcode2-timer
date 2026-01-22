import React, { useState, useEffect } from "react";
import axios from "axios";

const Admin = () => {
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;
  const [timerValue, setTimerValue] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [newEventText, setNewEventText] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Fetch the current timer, message, and announcement state
  const fetchState = async () => {
    try {
      const timerResponse = await axios.get(`${API_BASE_URL}/timer`);
      const messageResponse = await axios.get(`${API_BASE_URL}/message`);
      const announcementResponse = await axios.get(`${API_BASE_URL}/announcement`);
      const eventsResponse = await axios.get(`${API_BASE_URL}/upcoming-events`);

      setTimerValue(timerResponse.data.timerValue);
      setIsRunning(timerResponse.data.isRunning);
      setMessage(messageResponse.data.message);
      setAnnouncement(announcementResponse.data.announcement);
      setUpcomingEvents(eventsResponse.data.events);
    } catch (error) {
      console.error("Error fetching state:", error);
    }
  };

  // Update the timer value
  const updateTimerValue = async () => {
    const newValue = parseInt(inputValue, 10);
    if (!isNaN(newValue) && newValue >= 0) {
      try {
        await axios.post(`${API_BASE_URL}/timer`, { newValue });
        setInputValue("");
        fetchState();
      } catch (error) {
        console.error("Error updating timer:", error);
      }
    } else {
      alert("Please enter a valid number.");
    }
  };

  // Update the message
  const updateMessage = async () => {
    try {
      await axios.post(`${API_BASE_URL}/message`, { newMessage });
      setNewMessage("");
      fetchState();
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  // Update the announcement
  const updateAnnouncement = async () => {
    try {
      await axios.post(`${API_BASE_URL}/announcement`, { newAnnouncement });
      setNewAnnouncement("");
      fetchState();
    } catch (error) {
      console.error("Error updating announcement:", error);
    }
  };

  // Add new upcoming event
  const addEvent = async () => {
    try {
      if (newEventText && newEventDate) {
        await axios.post(`${API_BASE_URL}/upcoming-events`, {
          text: newEventText,
          date: newEventDate
        });
        setNewEventText("");
        setNewEventDate("");
        fetchState();
      } else {
        alert("Please enter both text and date for the event.");
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  // Delete upcoming event
  const deleteEvent = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/upcoming-events/${id}`);
      fetchState();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  // Toggle the play/pause state
  const toggleTimer = async () => {
    try {
      await axios.post(`${API_BASE_URL}/timer/play-pause`);
      fetchState();
    } catch (error) {
      console.error("Error toggling timer:", error);
    }
  };

  // Authentication check
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "reese" && password === "reese") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid credentials!");
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

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
          <h2>Timer: {timerValue} seconds</h2>
          <button onClick={toggleTimer} style={{ margin: "10px" }}>
            {isRunning ? "Pause" : "Play"}
          </button>
          <p><a href="https://www.calculateme.com/time/hours-minutes-seconds/to-seconds/36:0:0" target="_blank" rel="noopener noreferrer">Calculate Seconds</a></p>
          <div>
            <input
              type="number"
              placeholder="Enter new timer value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ margin: "10px" }}
            />
            <button onClick={updateTimerValue}>Update Timer</button>
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
