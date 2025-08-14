import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './HomePage';
import ModelConfigs from './ModelConfigs';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/model-configs" element={<ModelConfigs />} />
            </Routes>
        </Router>
    );
};

export default App;