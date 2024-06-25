import { BrowserRouter, Routes, Route  } from 'react-router-dom'
import './App.css'

import Home from './pages/Home'
import Profile from './pages/Profile'
import RecommendedFeed from './pages/RecommendedFeed'
import AllChats from './pages/AllChats'
import Chat from './pages/Chat'
import Search from './pages/Search'
import SignUp from './pages/SignUp'
import Login from './pages/Login'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/profile/:userHandle" element={<Profile />}/>
          <Route path="/recommended" element={<RecommendedFeed />}/>
          <Route path="/chats" element={<AllChats />}/>
          <Route path="/chat/:recipientUserHandle" element={<Chat />}/>
          <Route path="/search/s=:query" element={<Search />}/>
          <Route path="/sign-up" element={<SignUp />}/>
          <Route path="/login" element={<Login />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;
