import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { getPendingConnections } from "./util/connections";

import LoadingPage from "./LoadingPage";
import PendingConnection from "../components/PendingConnection";
import "./stylesheets/PendingConnections.css";

function PendingConnections() {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [pendingConnections, setPendingConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const pendingConnections = await getPendingConnections(cookies.user.id);
      setPendingConnections(pendingConnections);
    }

    loadData();

    setIsLoading(false);
  }, [cookies]);

  if (isLoading) {
    return <LoadingPage />;
  } else {
    return (
      <div className="page">
        <h1>Pending Connections</h1>
        <div className="pending-connections">
          {pendingConnections.map((pendingConnection) => (
            <PendingConnection pendingConnection={pendingConnection} />
          ))}
        </div>
      </div>
    );
  }
}

export default PendingConnections;
