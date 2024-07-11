import { useCookies } from "react-cookie";
import { getUserData, getUserPosts } from "./util/posts";
import {
  addConnection,
  getConnectionStatus,
  removeConnection,
  requestConnection,
} from "./util/connections";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Post from "../components/Post";
import FeaturedProject from "../components/FeaturedProject";
import LoadingPage from "./LoadingPage";

import { CONNECT_STATUS } from "./util/enums";

import "./stylesheets/ProfilePage.css";
// import connections from "../../../backend/endpoints/connections";

const WEB_ADDRESS = import.meta.env.VITE_WEB_ADDRESS;

// Gets username from URL to allow for more dynamic lookup via the URL.
const profileURL = window.location.href.split("/");
const profileUser = profileURL[profileURL.length - 1];

function ProfilePage() {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [profileUserData, setProfileUserData] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /***
   * Retrieves the profile picture from the database information.
   * If user has no profile picture, inserts a placeholder.
   */
  function getProfilePicture() {
    if (profileUserData.profilePicture !== "") {
      return (
        <>
          <img src={profileUserData.profilePicture} />
        </>
      );
    } else {
      return (
        <>
          <img src={"https://picsum.photos/200/200"} alt="no-user" />
        </>
      );
    }
  }

  /***
   * Handle changes to connections.
   */
  function handleConnection(connectionFunction) {
    connectionFunction(cookies.user.id, profileUserData.id);
    setConnectionStatus();
  }

  /***
   * Gets the connection button if depending on if the users are connected or the connection is pending.
   */
  function getConnectButton() {
    switch (connectionStatus) {
      case CONNECT_STATUS.CONNECTED:
        return (
          <button onClick={() => handleConnection(removeConnection)}>
            Connected
          </button>
        );

      case CONNECT_STATUS.REQUESTED:
        return (
          <button onClick={() => handleConnection(removeConnection)}>
            Pending
          </button>
        );

      case CONNECT_STATUS.RESPOND:
        return (
          <div>
            <button onClick={() => handleConnection(addConnection)}>
              Accept
            </button>
            <button onClick={() => handleConnection(removeConnection)}>
              Ignore
            </button>
          </div>
        );

      case CONNECT_STATUS.NOT_CONNECTED:
        return (
          <button onClick={() => handleConnection(requestConnection)}>
            Connect
          </button>
        );
        break;

      default:
        break;
    }
  }

  /***
   *  Returns profile information based on if the user is viewing their own profile or the profile of another user.
   */
  function profileInfo() {
    if (cookies.user.userHandle === profileUser) {
      return (
        <>
          <div></div>
        </>
      );
    } else {
      return (
        <>
          <div>{getConnectButton()}</div>
        </>
      );
    }
  }

  // Retrieve data upon page reload & cookies change.
  useEffect(() => {
    async function loadData() {
      const loadedProfileUserData = await getUserData(profileUser);
      await setProfileUserData(loadedProfileUserData);

      await setFeaturedProjects(loadedProfileUserData.featuredProjects);

      const userPosts = await getUserPosts(loadedProfileUserData.id);
      await setUserPosts(userPosts);

      const loadedConnectionStatus = await getConnectionStatus(
        cookies.user.id,
        loadedProfileUserData.id
      );

      await setConnectionStatus(loadedConnectionStatus);
    }

    loadData();

    setIsLoading(setIsLoading(false));
  }, [cookies, connectionStatus]);

  if (isLoading) {
    return <LoadingPage />;
  } else {
    return (
      <>
        <div className="profile-page">
          <section className="user-info">
            <div>
              {getProfilePicture()}
              <h1>
                {profileUserData.firstName + " " + profileUserData.lastName}
              </h1>
              <h2>@{profileUser}</h2>
              {profileInfo()}
              {featuredProjects.map((featuredProjectInfo) => (
                <FeaturedProject
                  key={featuredProjectInfo.id}
                  featuredProjectInfo={featuredProjectInfo}
                />
              ))}
              <div className="posts">
                {userPosts.map((postInfo) => (
                  <Post key={postInfo.id} postInfo={postInfo} />
                ))}
              </div>
            </div>
          </section>
          <section className="featured-post">{featuredProjects}</section>
        </div>
      </>
    );
  }
}

export default ProfilePage;
