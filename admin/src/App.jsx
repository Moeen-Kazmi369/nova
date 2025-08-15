import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import HomePage from "./HomePage";
import ModelConfigs from "./ModelConfigs";
import AccessDenied from "./pages/AccessDenied";
import Login from "./pages/Login";
import ProtectRoutes from "./components/ProtectRoutes";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectRoutes />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/model-configs" element={<ModelConfigs />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
