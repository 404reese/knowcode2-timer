import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Admin from "./pages/Admin";
import Countdown from "./pages/Countdown";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Countdown />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
};

export default App;
