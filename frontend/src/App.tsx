import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import ChallengeEditor from './ChallengeEditor';
import ThemeSelection from './components/ThemeSelection';
import { API_ENDPOINTS } from './config/api';


function App() {

    useEffect(() => {
        (async () => {
            const res = await fetch(API_ENDPOINTS.HEALTH);
            const data = await res.json();
            console.log(data);
        })();
    }, []);

    return (
        <Routes>
            <Route path="/" element={<ThemeSelection />} />
            <Route path="/challenge/:themeId" element={<ChallengeEditor />} />
        </Routes>
    );
}

export default App;
