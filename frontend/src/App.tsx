import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import CreatePage from './pages/CreatePage'
import ReaderPage from './pages/ReaderPage'
import MyStoriesPage from './pages/MyStoriesPage'
import CommunityPage from './pages/CommunityPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import ShareLandingPage from './pages/ShareLandingPage'
import FeedbackButton from './components/FeedbackButton'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CreatePage />} />
          <Route path="/stories" element={<MyStoriesPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="/reader/:storyId" element={<ReaderPage />} />
        <Route path="/share/:code" element={<ShareLandingPage />} />
      </Routes>
      <FeedbackButton />
    </ErrorBoundary>
  )
}

export default App
