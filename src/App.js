import { BrowserRouter as Routers, Routes, Route } from 'react-router-dom';
import AuthProvider from './provider/AuthProvider';
import Authentication from './pages/Authentication';
import HomePage from './pages';
import NotFound from './pages/NotFound';
import { CssBaseline } from '@mui/material';
import AppProvider from './provider/AppProvider';
import AccountCentral from './pages/AccountCentral';
import VideoCall from './pages/VideoCall';

function App() {
    return (
        <Routers>
            <CssBaseline />
            <AuthProvider>
                <AppProvider>
                    <Routes>
                        <Route path="/authentication" element={<Authentication />} />
                        <Route path="/account" element={<AccountCentral />} />
                        <Route path="/videoCall" element={<VideoCall />} />
                        <Route path="/" element={<HomePage />} />
                        <Route path="/*" element={<NotFound />} />
                    </Routes>
                </AppProvider>
            </AuthProvider>
        </Routers>
    );
}

export default App;
