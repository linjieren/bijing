import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import CreatePage from './pages/CreatePage'
import ReaderPage from './pages/ReaderPage'
import MyStoriesPage from './pages/MyStoriesPage'
import CommunityPage from './pages/CommunityPage'
import ProfilePage from './pages/ProfilePage'
import FeedbackButton from './components/FeedbackButton'

function App() {
  const showFeedback = import.meta.env.VITE_APP_ENV === 'dev'

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CreatePage />} />
          <Route path="/stories" element={<MyStoriesPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/reader/:storyId" element={<ReaderPage />} />
      </Routes>
      {showFeedback && <FeedbackButton />}
    </>
  )
}

export default App
