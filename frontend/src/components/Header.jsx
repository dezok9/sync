import { useCookies } from "react-cookie";
import { USER } from "../pages/util/enums";

import SyncLogo from "../../assets/OutlinedLogo.svg";

const WEB_ADDRESS = import.meta.env.VITE_WEB_ADDRESS;

import "./stylesheets/Header.css";

function Header() {
  const [cookies, setCookies, removeCookies] = useCookies([USER]);

  /***
   * Helper function for logging out.
   */
  function logOut() {
    removeCookies(USER, { path: "/" });
    window.location.assign(`${WEB_ADDRESS}/login`);
  }

  if (cookies[USER]) {
    return (
      <header className="sidebar">
        <img src={SyncLogo} className="sync-logo"></img>

        <div>
          <p
            className="sidebar-link"
            onClick={() => window.location.assign(`${WEB_ADDRESS}`)}
          >
            <i className="home-sidebar-icon fa-solid fa-house fa-lg"></i> Home
          </p>
        </div>
        <p
          className="sidebar-link"
          onClick={() =>
            window.location.assign(
              `${WEB_ADDRESS}/profile/${cookies.user.userHandle}`
            )
          }
        >
          <i className="profile-sidebar-icon fa-solid fa-user fa-lg"></i>{" "}
          Profile
        </p>
        <p
          className="sidebar-link"
          onClick={() => window.location.assign(`${WEB_ADDRESS}/connections`)}
        >
          <i className="connections-sidebar-icon fa-solid fa-link fa-lg"></i>{" "}
          Connections
        </p>
        <div className="logout sidebar-link" onClick={() => logOut()}>
          <i className="logout-sidebar-icon fa-solid fa-arrow-right-from-bracket fa-lg"></i>{" "}
          Logout
        </div>
      </header>
    );
  } else {
    return (
      <div>
        <section
          className="login nav-bar-link"
          onClick={() => window.location.assign(`${WEB_ADDRESS}/login`)}
        >
          Login
        </section>
      </div>
    );
  }
}

export default Header;
