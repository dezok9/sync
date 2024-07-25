import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { getUserDataID } from "../pages/util/posts";
import { useNavigate } from "react-router";
import { USER } from "../pages/util/enums";
import { renderProfilePicture } from "../pages/util/html";

import "./stylesheets/Connection.css";
import { addConnection, requestConnection } from "../pages/util/connections";

function Connection(connectionInfo) {
  const navigate = useNavigate();
  const [cookies, setCookies, removeCookies] = useCookies([USER]);
  const [clicked, setClicked] = useState(false);

  /***
   * Renders the connect button if not connected.
   */
  function renderConnectButton() {
    if (!connectionInfo.connectionInfo.connected) {
      return (
        <button
          className="connect-button"
          onClick={(event) => {
            event.stopPropagation();
            requestConnection(
              cookies.user.id,
              connectionInfo.connectionInfo.id
            );
            setClicked(!clicked);
          }}
        >
          {clicked ? "Requested" : "Connect"}
        </button>
      );
    }
  }

  return (
    <span
      className="connection"
      onClick={() =>
        navigate(`/profile/${connectionInfo.connectionInfo.userHandle}`)
      }
    >
      <div>
        {renderProfilePicture(connectionInfo.connectionInfo.profilePicture)}
        <h3>
          {connectionInfo.connectionInfo.firstName}{" "}
          {connectionInfo.connectionInfo.lastName}
        </h3>
        <p>@{connectionInfo.connectionInfo.userHandle}</p>
      </div>
      {renderConnectButton()}
    </span>
  );
}

export default Connection;
