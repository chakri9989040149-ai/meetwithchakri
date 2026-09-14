import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import CreateMeeting from './pages/CreateMeeting';
import JoinMeeting from './pages/JoinMeeting';
import IntroPage from './pages/IntroPage';
import MeetingRoom from './pages/MeetingRoom';
import ErrorPage from './pages/ErrorPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* 1. Landing Homepage */}
        <Route path="/" element={<Landing />} />

        {/* 2. Create Instant Meeting */}
        <Route path="/create" element={<CreateMeeting />} />

        {/* 3. Join Meeting by Code or URL */}
        <Route path="/join" element={<JoinMeeting />} />

        {/* 4. Intro Transition Page */}
        <Route path="/intro" element={<IntroPage />} />

        {/* 5. Live Meeting Room (Flow: Intro -> Pre-join Lobby -> WebRTC Room) */}
        <Route path="/room/:roomId" element={<MeetingRoom />} />

        {/* 6. Error Notice Page */}
        <Route path="/error" element={<ErrorPage />} />

        {/* 7. Catch-all Not Found Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
