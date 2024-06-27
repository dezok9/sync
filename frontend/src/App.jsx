import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy } from "react";
import "./stylesheets/App.css";

// React.lazy() prevents the loading of pages until absolutely necessary to optimize user experience.
// Documentation for React.lazy() can be found here: https://react.dev/reference/react/lazy.
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const RecommendedFeed = lazy(() => import("./pages/RecommendedFeed"));
const AllChats = lazy(() => import("./pages/AllChats"));
const Chat = lazy(() => import("./pages/Chat"));
const Search = lazy(() => import("./pages/Search"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Login = lazy(() => import("./pages/Login"));

import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <div className="page">
        <Header />

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile/:userHandle" element={<Profile />} />
            <Route path="/recommended" element={<RecommendedFeed />} />
            <Route path="/chats" element={<AllChats />} />
            <Route path="/chat/:recipientUserHandle" element={<Chat />} />
            <Route path="/search/s=:query" element={<Search />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </BrowserRouter>

        <Footer />
      </div>
    </>
  );
}

export default App;
