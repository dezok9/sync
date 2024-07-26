import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { getPendingConnections } from "./util/connections";
import { USER } from "./util/enums";

import LoadingPage from "./LoadingPage";
import Connection from "../components/Connection";
import "./stylesheets/PendingConnections.css";

function PendingConnections() {
  const [cookies, setCookies, removeCookies] = useCookies([USER]);
  const [pendingConnections, setPendingConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const loadedPendingConnections = await getPendingConnections(
        cookies.user.id
      );
      setPendingConnections(loadedPendingConnections);
    }

    loadData().then(() => setIsLoading(false));
  }, [cookies]);

  if (isLoading) {
    return <LoadingPage />;
  } else {
    return (
      <div className="page">
        <h1>Pending Connections</h1>
        <div className="connections">
          {pendingConnections.map((pendingConnection) => (
            <Connection connectionInfo={pendingConnection} />
          ))}
        </div>
      </div>
    );
  }
}

export default PendingConnections;
