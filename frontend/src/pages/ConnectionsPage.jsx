import { useCookies } from "react-cookie";
import { getConnections, getRecommendedUsers } from "./util/connections";
import { redirectDocument, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { USER } from "./util/enums";

import LoadingPage from "./LoadingPage";
import Connection from "../components/Connection";

import "./stylesheets/ConnectionsPage.css";

const NUMBER_OF_RECOMMENDATIONS = 5;

function ConnectionsPage() {
  const [cookies] = useCookies([USER]);
  const [userConnectionsData, setUserConnectionsData] = useState([]);
  const [recommendedUsersData, setRecommendedUsersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  function renderConnections() {
    if (userConnectionsData.length > 0) {
      return (
        <>
          {userConnectionsData.map((userConnectionData) => (
            <Connection
              key={userConnectionData.id}
              connectionInfo={userConnectionData}
            />
          ))}
        </>
      );
    } else {
      return (
        <div className="connections-placeholder">
          Connect with new users to have them display here!
        </div>
      );
    }
  }

  useEffect(() => {
    async function loadData() {
      const loadedUserConnectionsData = await getConnections(cookies.user.id);
      await setUserConnectionsData(
        loadedUserConnectionsData.map((connectionsData) => {
          return { ...connectionsData, connected: true };
        })
      );

      const loadedRecommendedUsersData = await getRecommendedUsers(
        cookies.user.id,
        NUMBER_OF_RECOMMENDATIONS
      );
      await setRecommendedUsersData(
        loadedRecommendedUsersData.map((connectionsData) => {
          return { ...connectionsData, connected: false };
        })
      );
    }

    loadData().then(() => setIsLoading(false));
  }, [cookies]);

  if (isLoading) {
    return <LoadingPage />;
  } else {
    return (
      <div className="connections-page">
        <div className="connections-section">
          <span className="connections-header">
            <h1>Connections</h1>
            <button
              className="pending-button"
              onClick={() => navigate("/connections/pending")}
            >
              Pending Connections
            </button>
          </span>
          {renderConnections()}
        </div>
        <div className="connections-section">
          <h2>
            Recommended Connections
            <i className="info-circle fa-solid fa-circle-info fa-sm"></i>
            <div className="connection-info">
              Recommendations are based on GitHub similarity and the
              compatablity of your Sync profiles.
            </div>
          </h2>
          {recommendedUsersData.map((recommendedUserData) => (
            <Connection
              key={recommendedUserData.id}
              connectionInfo={recommendedUserData}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default ConnectionsPage;
