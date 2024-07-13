import { useCookies } from "react-cookie";
import { getConnections, getRecommendedUsers } from "./util/connections";
import { useState, useEffect } from "react";

import LoadingPage from "./LoadingPage";
import Connection from "../components/Connection";

const NUMBER_OF_RECOMMENDATIONS = 5;

function ConnectionsPage() {
  const [cookies] = useCookies(["user"]);
  const [userConnectionsData, setUserConnectionsData] = useState([]);
  const [recommendedUsersData, setRecommendedUsersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const loadedUserConnectionsData = await getConnections(cookies.user.id);
      await setUserConnectionsData(loadedUserConnectionsData);

      const loadedRecommendedUsersData = await getRecommendedUsers(
        cookies.user.id,
        NUMBER_OF_RECOMMENDATIONS
      );
      await setRecommendedUsersData(loadedRecommendedUsersData);
    }

    loadData();
    setIsLoading(false);
  }, [cookies]);

  if (isLoading) {
    return (
      <div>
        <LoadingPage />
      </div>
    );
  } else {
    return (
      <div>
        <div>
          <h1>Connections</h1>
          {userConnectionsData.map((userConnectionData) => (
            <Connection
              key={userConnectionData.id}
              connectionInfo={userConnectionData}
            />
          ))}
        </div>
        <div>
          <h2>Recommended Connections</h2>
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
