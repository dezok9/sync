import { useCookies } from "react-cookie";
import { getUserData, getUserPosts } from "./util/posts";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Post from "../components/Post";
import FeaturedProject from "../components/FeaturedProject";
import LoadingPage from "./LoadingPage";

import { CONNECT_STATUS } from "./util/enums";

import "./stylesheets/ProfilePage.css";
import { getConnectionStatus } from "./util/connections";

const WEB_ADDRESS = import.meta.env.VITE_WEB_ADDRESS;

// Gets username from URL to allow for more dynamic lookup via the URL.
const profileURL = window.location.href.split("/");
const profileUser = profileURL[profileURL.length - 1];

// Helper asynchronous functions.

/***
 * Helper function for asyncronously loading user data.
 */
async function loadProfileUserData() {
  const profileUserData = await getUserData(profileUser);
  return profileUserData;
}

/***
 * Helper function for asyncronously loading user posts.
 */
async function loadUserPosts(userID) {
  const userPosts = await getUserPosts(userID);
  return userPosts;
}

/***
 * Helper function for asyncronously getting the status of a connection between two users.
 */
async function loadConnectionStatus(userID, connectionID) {
  const userConnection = await getConnectionStatus(userID, connectionID);
  return userConnection;
}

function ProfilePage() {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [profileUserData, setProfileUserData] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

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
   * Gets the connection button if depending on if the users are connected or the connection is pending.
   */
  function getConnectButton() {
    switch (connectionStatus) {
      case CONNECT_STATUS.CONNECTED:
        return <button>Connected</button>;

      case CONNECT_STATUS.REQUESTED:
        return <button>Pending</button>;

      case CONNECT_STATUS.TO_ACCEPT:
        return (
          <div>
            <button>Accept</button>
            <button>Ignore</button>
          </div>
        );

      case CONNECT_STATUS.NOT_CONNECTED:
        return <button>Connect</button>;
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
      const profileUserData = await loadProfileUserData(cookies.user);
      await setProfileUserData(profileUserData);

      await setFeaturedProjects(profileUserData.featuredProjects);

      const userPosts = await loadUserPosts(profileUserData.id);
      await setUserPosts(userPosts);

      const connectionStatus = await loadConnectionStatus(
        cookies.user.id,
        profileUserData.id
      );

      await setConnectionStatus(connectionStatus);
    }

    loadData();

    setIsLoading(setIsLoading(false));
  }, [cookies]);

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
