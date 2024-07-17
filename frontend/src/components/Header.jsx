import { useCookies } from "react-cookie";
import { USER } from "../pages/util/enums";

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
      <header className="header">
        <h3 className="sync-logo">Sync</h3>
        <section className="nav-bar">
          <p
            className="nav-bar-link"
            onClick={() => window.location.assign(`${WEB_ADDRESS}`)}
          >
            Home
          </p>
          <p
            className="nav-bar-link"
            onClick={() =>
              window.location.assign(
                `${WEB_ADDRESS}/profile/${cookies.user.userHandle}`
              )
            }
          >
            Profile
          </p>
          <p
            className="nav-bar-link"
            onClick={() => window.location.assign(`${WEB_ADDRESS}/connections`)}
          >
            Connections
          </p>
        </section>
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input className="search-field"></input>
        </div>
        <section className="logout nav-bar-link" onClick={() => logOut()}>
          <i className="fa-solid fa-door-open fa-xl"></i> Logout
        </section>
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
