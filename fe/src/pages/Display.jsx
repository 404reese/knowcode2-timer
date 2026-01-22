import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Display.css";

const Display = () => {
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;
  const [timerValue, setTimerValue] = useState(36 * 3600); // 36 hours in seconds
  const [message, setMessage] = useState("SIP CODE REPEAT");
  const [announcement, setAnnouncement] = useState("Dinner Ready Wanna get Cheesy UwU");

  // Format seconds into hours, minutes and seconds
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  };

  // Fetch the current timer, message, and announcement
  const fetchState = async () => {
    try {
      const timerResponse = await axios.get(`${API_BASE_URL}/timer`);
      const messageResponse = await axios.get(`${API_BASE_URL}/message`);
      const announcementResponse = await axios.get(`${API_BASE_URL}/announcement`);

      setTimerValue(timerResponse.data.timerValue);
      setMessage(messageResponse.data.message);
      setAnnouncement(announcementResponse.data.announcement);
    } catch (error) {
      console.error("Error fetching state:", error);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1000); // Refresh every second
    return () => clearInterval(interval);
  }, []);

  const time = formatTime(timerValue);

  return (
    <div className="display-container">
      {/* Video Background */}
      <video
        className="video-background"
        src="/p2.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay Content */}
      <div className="overlay">
        {/* Logo */}
        <img src="/kn-logo-n.png" alt="KN Logo" className="logo" />

        {/* Countdown Timer */}
        <div className="timer-container">
          <h1 className="timer-title">Hackathon Countdown</h1>
          <div className="timer-display">
            <div className="time-unit-container">
              <span className="time-number">{time.hours}</span>
              <span className="time-label">Hours</span>
            </div>
            <span className="time-separator">:</span>
            <div className="time-unit-container">
              <span className="time-number">{time.minutes}</span>
              <span className="time-label">Minutes</span>
            </div>
            <span className="time-separator">:</span>
            <div className="time-unit-container">
              <span className="time-number">{time.seconds}</span>
              <span className="time-label">Seconds</span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && <div className="message-text">{message}</div>}

        {/* Announcement */}
        <div className="announcement-container">
          <img src="/ann-final.png" alt="Announcement" className="announcement-image" />
          <div className="announcement-text">{announcement}</div>
        </div>
      </div>
    </div>
  );
};

export default Display;
