import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy } from "react";
import "./stylesheets/App.css";

// React.lazy() prevents the loading of pages until absolutely necessary to optimize user experience.
// Documentation for React.lazy() can be found here: https://react.dev/reference/react/lazy.
const HomePage = lazy(() => import("./pages/HomePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RecommendedFeedPage = lazy(() => import("./pages/RecommendedFeedPage"));
const AllChatsPage = lazy(() => import("./pages/AllChatsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <div className="page">
        <Header />

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile/:userHandle" element={<ProfilePage />} />
            <Route path="/recommended" element={<RecommendedFeedPage />} />
            <Route path="/chats" element={<AllChatsPage />} />
            <Route path="/chat/:recipientUserHandle" element={<ChatPage />} />
            <Route path="/search/s=:query" element={<SearchPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>

        <Footer />
      </div>
    </>
  );
}

export default App;
