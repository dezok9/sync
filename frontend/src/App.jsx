import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { CookiesProvider, useCookies } from "react-cookie";
import { Suspense, lazy, useState } from "react";
import LoadingPage from "./pages/LoadingPage";
import Page404 from "./pages/Page404";

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
const PendingConnectionsPage = lazy(() =>
  import("./pages/PendingConnectionsPage")
);
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const PostPage = lazy(() => import("./pages/PostPage"));

const GitHubAuthRedirect = lazy(() => import("./pages/GitHubAuthRedirect"));

import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);

  // For routes requiring that the user is logged in.
  const PrivateRoutes = () => {
    if (!cookies.user) {
      return <Navigate to="/login" />;
    } else {
      return <Outlet />;
    }
  };

  // For routes requiring that users are logged out (i.e. signup & login).
  const AuthRoutes = () => {
    if (cookies.user) {
      return <Navigate to="/" />;
    } else {
      return <Outlet />;
    }
  };

  return (
    <div className="page">
      <Header />

      <CookiesProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              <Route element={<PrivateRoutes />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/chats" element={<AllChatsPage />} />
                <Route path="/recommended" element={<RecommendedFeedPage />} />
                <Route path="/post/:postID" element={<PostPage />} />
                <Route path="/profile/:userHandle" element={<ProfilePage />} />
                <Route
                  path="/chat/:recipientUserHandle"
                  element={<ChatPage />}
                />
                <Route
                  path="/connections/pending"
                  element={<PendingConnectionsPage />}
                />
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/search/s=:query" element={<SearchPage />} />
              </Route>
              <Route element={<AuthRoutes />}>
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route path="/login" element={<LoginPage />} />
              </Route>
              <Route path="/auth" element={<GitHubAuthRedirect />} />
              <Route path="/404" element={<Page404 />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CookiesProvider>

      <Footer />
    </div>
  );
}

export default App;
