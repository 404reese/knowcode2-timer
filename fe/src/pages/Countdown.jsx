import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import './Countdown.css';

const Countdown = () => {
    const [timerValue, setTimerValue] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [alertBanner, setAlertBanner] = useState(null);
    const hasAlertedRef = useRef(false);
    const alertTimeoutRef = useRef(null);
    const audioCtxRef = useRef(null);
    const [audioUnlocked, setAudioUnlocked] = useState(false);

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContextClass();
        }
        return audioCtxRef.current;
    };

    // Browsers block audio until the page has received a user gesture.
    // Since this screen is often left open unattended, show a one-time
    // "tap to enable sound" prompt that unlocks the shared AudioContext.
    const unlockAudio = () => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        setAudioUnlocked(true);
    };

    useEffect(() => {
        const handleFirstInteraction = () => unlockAudio();
        window.addEventListener('click', handleFirstInteraction, { once: true });
        window.addEventListener('touchstart', handleFirstInteraction, { once: true });
        window.addEventListener('keydown', handleFirstInteraction, { once: true });
        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
    }, []);

    // Play a short alarm beep using the Web Audio API (no audio asset needed)
    const playAlertSound = () => {
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
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

    const isTimeUp = isComplete;

    // Trigger the alert sound once, right when the timer transitions to 0
    useEffect(() => {
        if (isTimeUp && !hasAlertedRef.current) {
            hasAlertedRef.current = true;
            playAlertSound();
        } else if (!isTimeUp) {
            hasAlertedRef.current = false;
        }
    }, [isTimeUp]);

    // Live state pushed from the server over the socket (timer, phase,
    // announcement and upcoming events all arrive in one push, no more polling)
    useEffect(() => {
        const handleState = (state) => {
            setTimerValue(state.phaseRemaining);
            setIsComplete(state.isComplete);
            setAnnouncement(state.announcement);
            setUpcomingEvents(state.upcomingEvents || []);
        };

        const handleAlert = (alert) => {
            playAlertSound();
            setAlertBanner(alert.text);
            clearTimeout(alertTimeoutRef.current);
            alertTimeoutRef.current = setTimeout(() => setAlertBanner(null), 6000);
        };

        socket.on('state', handleState);
        socket.on('alert', handleAlert);

        return () => {
            socket.off('state', handleState);
            socket.off('alert', handleAlert);
            clearTimeout(alertTimeoutRef.current);
        };
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
                <source src="/video.mp4" type="video/mp4" />
            </video>

            <div className="header-section">
                <img src="/kjsit-white.svg" className="kjsit-logo" alt="KJSIT Logo" />
                <img src="/kb2-logo2.png" style={{ width: '100%', maxWidth: '500px' }} alt="KB2 Logo" />
                <img src="/s4ds%20white.png" className="yrs-logo" alt="S4DS Logo" />
            </div>

            {!audioUnlocked && (
                <div className="sound-unlock-banner" onClick={unlockAudio}>
                    🔊 Tap anywhere to enable sound
                </div>
            )}

            {alertBanner && <div className="alert-banner">{alertBanner}</div>}

            <div className="timer-container">
                {isTimeUp ? (
                    <div className="time-up-text">TIME'S UP</div>
                ) : (
                    <div className="timer-display">
                        <div className="timer-numbers">
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
