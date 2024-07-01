import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { CookiesProvider, useCookies } from "react-cookie";
import { Suspense, lazy, useState } from "react";
import { handleLogin } from "./pages/util/auth";
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
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [isAuthenticated, setIsAuthenticated] = useState(cookies.user != null);

  // For routes requiring that the user is logged in.
  const PrivateRoutes = () => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    } else {
      return <Outlet />;
    }
  };

  // For routes requiring that users are logged out (i.e. signup & login).
  const AuthRoutes = () => {
    if (isAuthenticated) {
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
          <Suspense>
            <Routes>
              <Route element={<PrivateRoutes />}>
                <Route
                  path="/"
                  element={
                    <HomePage
                      cookies={{ cookies, setCookies, removeCookies }}
                      isAuthenticated={isAuthenticated}
                      setIsAuthenticated={setIsAuthenticated}
                    />
                  }
                />
                <Route path="/chats" element={<AllChatsPage />} />
                <Route path="/recommended" element={<RecommendedFeedPage />} />
                <Route path="/profile/:userHandle" element={<ProfilePage />} />
                <Route
                  path="/chat/:recipientUserHandle"
                  element={<ChatPage />}
                />
                <Route path="/search/s=:query" element={<SearchPage />} />
              </Route>
              <Route element={<AuthRoutes />}>
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route
                  path="/login"
                  element={
                    <LoginPage
                      isAuthenticated={isAuthenticated}
                      setIsAuthenticated={setIsAuthenticated}
                    />
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CookiesProvider>

      <Footer />
    </div>
  );
}

export default App;
