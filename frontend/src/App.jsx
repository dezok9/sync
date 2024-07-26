import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { CookiesProvider, useCookies } from "react-cookie";
import { Suspense, lazy, useState } from "react";
import { USER, ACCEPTED_COOKIES } from "./pages/util/enums";
import LoadingPage from "./pages/LoadingPage";
import Page404 from "./pages/Page404";

import "./stylesheets/App.css";

// React.lazy() prevents the loading of pages until absolutely necessary to optimize user experience.
// Documentation for React.lazy() can be found here: https://react.dev/reference/react/lazy.
const HomePage = lazy(() => import("./pages/HomePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RecommendedFeedPage = lazy(() => import("./pages/RecommendedFeedPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PendingConnectionsPage = lazy(() =>
  import("./pages/PendingConnectionsPage")
);
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const PostPage = lazy(() => import("./pages/PostPage"));

const GitHubAuthRedirect = lazy(() => import("./pages/GitHubAuthRedirect"));

const FeaturedProjectCreationPage = lazy(() =>
  import("./pages/FeaturedProjectCreationPage")
);

import CookiesQuestion from "./components/CookiesQuestion";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  const [cookies, setCookies, removeCookies] = useCookies([USER]);

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
                <Route path="/recommended" element={<RecommendedFeedPage />} />
                <Route path="/post/:postID" element={<PostPage />} />
                <Route path="/profile/:userHandle" element={<ProfilePage />} />
                <Route
                  path="/create-featured"
                  element={<FeaturedProjectCreationPage />}
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
