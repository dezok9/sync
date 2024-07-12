import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { getUserDataID } from "../pages/util/posts";
import { useNavigate } from "react-router";

import "./stylesheets/Connection.css";

function Connection(connectionInfo) {
  const navigate = useNavigate();
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);

  return (
    <span
      className="connection"
      onClick={() => navigate(`/profile/${connectionInfo.userHandle}`)}
    >
      <div>
        <h3>
          {connectionInfo.connectionInfo.firstName}{" "}
          {connectionInfo.connectionInfo.lastName}
        </h3>
        <p>@{connectionInfo.connectionInfo.userHandle}</p>
      </div>
    </span>
  );
}

export default Connection;
