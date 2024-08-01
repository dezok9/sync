import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { USER } from "../pages/util/enums";
import { getUserData } from "../pages/util/posts";

import SyncLogo from "../../assets/OutlinedLogo.svg";
import LoadingPage from "../pages/LoadingPage";

const WEB_ADDRESS = import.meta.env.VITE_WEB_ADDRESS;

import "./stylesheets/Header.css";

function Header() {
  const [cookies, setCookies, removeCookies] = useCookies([USER]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [search, setSearch] = useState("");

  const [homeActive] = useState(window.location.href === `${WEB_ADDRESS}/`);
  const [profileActive, setProfileActive] = useState(false);
  const [connectionsActive] = useState(
    window.location.href.includes(`${WEB_ADDRESS}/connections`)
  );

  /***
   * Helper function for logging out.
   */
  function logOut() {
    removeCookies(USER, { path: "/" });
    window.location.assign(`${WEB_ADDRESS}/login`);
  }

  // Retrieve data upon page reload & cookies change.
  useEffect(() => {
    async function loadData() {
      const loadedUserData = await getUserData(cookies.user.userHandle);
      await setUserData(loadedUserData);

      if (
        window.location.href ===
        `${WEB_ADDRESS}/profile/${cookies.user.userHandle}`
      ) {
        setProfileActive(true);
      }
    }

    loadData().then(() => setIsLoading(false));
  }, [cookies]);

  if (isLoading) {
    return <LoadingPage />;
  } else if (cookies[USER]) {
    return (
      <>
        <header className="sidebar">
          <img src={SyncLogo} className="sync-logo"></img>
          {/* Main sidebar */}

          {/* Menu */}
          <section className="menu-section">
            <p className="sidebar-section-header">MENU</p>
            <div>
              <p
                className={"tab " + (homeActive ? "active-tab" : "")}
                onClick={() => window.location.assign(`${WEB_ADDRESS}`)}
              >
                Feed
              </p>
            </div>
            <p
              className={"tab " + (profileActive ? "active-tab" : "")}
              onClick={() =>
                window.location.assign(
                  `${WEB_ADDRESS}/profile/${cookies.user.userHandle}`
                )
              }
            >
              Profile
            </p>
            <p
              className={"tab " + (connectionsActive ? "active-tab" : "")}
              onClick={() =>
                window.location.assign(`${WEB_ADDRESS}/connections`)
              }
            >
              Connections
            </p>
          </section>

          {/* Settings */}
          <p className="sidebar-section-header">OTHER</p>
          <div className="tab">Settings</div>
          <div className="logout tab" onClick={() => logOut()}>
            Logout
          </div>
        </header>

        {/* Navigation bar */}
        <span className="nav-bar">
          <div>
            <section className="header-info">
              Welcome back, {userData.firstName}.
            </section>
            <p>Let's get you caught up.</p>
          </div>
          <div className="nav-bar-options">
            <div className="search-bar">
              <i className="fa-solid fa-magnifying-glass fa-lg"></i>
              <input
                className="search-bar-input"
                placeholder="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              ></input>
            </div>
            <button className="nav-bar-button">One</button>
            <button className="nav-bar-button">Two</button>
          </div>
        </span>
      </>
    );
  } else {
    return <></>;
  }
}

export default Header;
