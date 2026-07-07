import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginSignup from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginSignup />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;