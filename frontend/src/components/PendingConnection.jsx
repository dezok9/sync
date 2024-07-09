import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { getUserDataID } from "../pages/util/posts";
import { useNavigate } from "react-router";

import "./stylesheets/PendingConnection.css";

function PendingConnection(connectionInfo) {
  const navigate = useNavigate();
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [connectionData, setConnectionData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const connectionData = await getUserDataID(
        connectionInfo.pendingConnection.recipientID
      );

      setConnectionData(connectionData);
    }

    loadData();
  }, [cookies]);

  return (
    <span
      className="pending-connection"
      onClick={() => navigate(`/profile/${connectionData.userHandle}`)}
    >
      <div>
        <h3>
          {connectionData.firstName} {connectionData.lastName}
        </h3>
        <p>@{connectionData.userHandle}</p>
      </div>
    </span>
  );
}

export default PendingConnection;
