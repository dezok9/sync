import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { getUserDataID } from "../pages/util/posts";
import { useNavigate } from "react-router";
import { USER } from "../pages/util/enums";

import "./stylesheets/Connection.css";

function Connection(connectionInfo) {
  const navigate = useNavigate();
  const [cookies, setCookies, removeCookies] = useCookies([USER]);

  return (
    <span
      className="connection"
      onClick={() =>
        navigate(`/profile/${connectionInfo.connectionInfo.userHandle}`)
      }
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
