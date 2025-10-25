import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import ChallengeEditor from './ChallengeEditor';
import ThemeSelection from './components/ThemeSelection';


function App() {

    useEffect(() => {
        (async () => {
            const res = await fetch('http://localhost:8000/api/health');
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
