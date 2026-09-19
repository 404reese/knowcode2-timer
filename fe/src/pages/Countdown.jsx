import React, { useState, useEffect, useRef } from 'react';
import './Countdown.css';

const Countdown = () => {
    const [timerValue, setTimerValue] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const hasAlertedRef = useRef(false);

    const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

    // Play a short alarm beep using the Web Audio API (no audio asset needed)
    const playAlertSound = () => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContextClass();
            const playBeep = (startTime) => {
                const oscillator = ctx.createOscillator();
                const gain = ctx.createGain();
                oscillator.type = 'square';
                oscillator.frequency.value = 880;
                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
                oscillator.connect(gain);
                gain.connect(ctx.destination);
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.4);
            };
            const now = ctx.currentTime;
            playBeep(now);
            playBeep(now + 0.5);
            playBeep(now + 1.0);
        } catch (error) {
            console.error('Error playing alert sound:', error);
        }
    };

    const isTimeUp = timerValue <= 0;

    // Trigger the alert sound once, right when the timer transitions to 0
    useEffect(() => {
        if (isTimeUp && !hasAlertedRef.current) {
            hasAlertedRef.current = true;
            playAlertSound();
        } else if (!isTimeUp) {
            hasAlertedRef.current = false;
        }
    }, [isTimeUp]);

    // Timer Logic
    const fetchTimerState = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/timer`);
            const data = await response.json();
            setTimerValue(data.timerValue);
            setIsTimerRunning(data.isRunning);
        } catch (error) {
            console.error('Error fetching timer:', error);
        }
    };

    useEffect(() => {
        fetchTimerState();
        const syncInterval = setInterval(fetchTimerState, 1000); // Sync every 1 second

        const countdownInterval = setInterval(() => {
            if (isTimerRunning && timerValue > 0) {
                setTimerValue(prev => (prev > 0 ? prev - 1 : 0));
            }
        }, 1000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(countdownInterval);
        };
    }, [isTimerRunning]); // Depend on isTimerRunning to ensure interval uses correct state if needed, though simple logic works without

    // Announcement Logic
    const fetchAnnouncement = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/announcement`);
            const data = await response.json();
            if (data.announcement && data.announcement !== announcement) {
                setAnnouncement(data.announcement);
            }
        } catch (error) {
            console.error('Error fetching announcement:', error);
        }
    };

    useEffect(() => {
        fetchAnnouncement();
        const interval = setInterval(fetchAnnouncement, 2000);
        return () => clearInterval(interval);
    }, []); // Run once on mount

    // Upcoming Events Logic
    const fetchUpcomingEvents = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/upcoming-events`);
            const data = await response.json();
            setUpcomingEvents(data.events || []);
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
        }
    };

    useEffect(() => {
        fetchUpcomingEvents();
        const interval = setInterval(fetchUpcomingEvents, 5000); // Sync every 5 seconds
        return () => clearInterval(interval);
    }, []);



    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        return {
            h: h < 10 ? "0" + h : h,
            m: m < 10 ? "0" + m : m,
            s: s < 10 ? "0" + s : s
        };
    };

    const time = formatTime(timerValue);

    return (
        <div className="countdown-page">
            <video id="bg-video" autoPlay loop muted playsInline>
                <source src="/video1.mp4" type="video/mp4" />
            </video>

            <div className="header-section">
                <img src="/kjsit-white.svg" className="kjsit-logo" alt="KJSIT Logo" />
                <img src="/full-export@3x.png" style={{ width: '100%', maxWidth: '600px' }} alt="KnowCode Logo" />
                <img src="/25yrs.png" className="yrs-logo" alt="25 Years Logo" />
            </div>

            <div className="timer-container">
                {isTimeUp ? (
                    <div className="time-up-text">TIME'S UP</div>
                ) : (
                    <div className="timer-display">
                        {/* Hours */}
                        <div className="time-unit">
                            <div className="number" id="hours">{time.h}</div>
                            <div className="label">Hours</div>
                        </div>

                        <div className="separator">:</div>

                        {/* Minutes */}
                        <div className="time-unit">
                            <div className="number" id="minutes">{time.m}</div>
                            <div className="label">Minutes</div>
                        </div>

                        <div className="separator">:</div>

                        {/* Seconds */}
                        <div className="time-unit">
                            <div className="number" id="seconds">{time.s}</div>
                            <div className="label">Seconds</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="intel-grid">
                <div className="intel-card">
                    <div className="card-header">
                        <span>Upcoming Events</span>
                        <span
                            style={{ height: '8px', width: '8px', background: 'red', borderRadius: '50%', boxShadow: '0 0 10px red', animation: 'pulse 0.5s infinite' }}></span>
                    </div>
                    <div className="news-list">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event) => (
                                <div className="news-item" key={event.id}>
                                    <span className="time-stamp">
                                        {new Date(event.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="news-content">{event.text}</span>
                                </div>
                            ))
                        ) : (
                            <div className="news-item">
                                <span className="news-content">No upcoming events</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="intel-card">
                    <div className="card-header">
                        <span>Announcement</span>
                    </div>
                    <div className="quote-text" id="typewriter">
                        {announcement}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Countdown;
