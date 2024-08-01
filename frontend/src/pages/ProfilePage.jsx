import { useCookies } from "react-cookie";
import { getUserData, getUserPosts, generateDateTimestamp } from "./util/posts";
import {
  addConnection,
  getConnectionStatus,
  removeConnection,
  requestConnection,
} from "./util/connections";
import { useState, useEffect } from "react";
import { createInteraction } from "./util/interactions";
import { useNavigate } from "react-router-dom";
import { USER } from "./util/enums";
import { CONNECT_STATUS } from "./util/enums";
import { ProfilePictureUploadWidget } from "./util/html";
import { updateProfilePicture } from "./util/user";

import Post from "../components/Post";
import FeaturedProject from "../components/FeaturedProject";
import LoadingPage from "./LoadingPage";

import "./stylesheets/ProfilePage.css";

const WEB_ADDRESS = import.meta.env.VITE_WEB_ADDRESS;

// Gets username from URL to allow for more dynamic lookup via the URL.
const profileURL = window.location.href.split("/");
const profileUser = profileURL[profileURL.length - 1];

function ProfilePage() {
  const [cookies, setCookies, removeCookies] = useCookies([USER]);
  const [profileUserData, setProfileUserData] = useState({});
  const [profilePicture, setProfilePicture] = useState(
    <img className="main-profile-picture" src="" />
  );
  const [userPosts, setUserPosts] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const { date, timestamp } = generateDateTimestamp();
  let timer = 0; // Amount of time the user has spent on the profile page in seconds

  /***
   * Renders the edit option for profile pictures.
   */
  function renderEditProfilePicture() {
    if (cookies.user.id === profileUserData.id) {
      return (
        <ProfilePictureUploadWidget
          userID={profileUserData.id}
          setProfilePicture={setProfilePicture}
        />
      );
    }
  }

  /***
   * Retrieves the profile picture from the database information.
   * If user has no profile picture, inserts a placeholder.
   */
  function getProfilePicture() {
    if (profileUserData.profilePicture !== "") {
      return (
        <>
          {profilePicture}
          {renderEditProfilePicture()}
        </>
      );
    } else {
      return (
        <>
          <img
            className="main-profile-picture"
            src={"https://picsum.photos/200/200"}
            alt="no-user"
          />
          {renderEditProfilePicture()}
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

  // Renders the featured projects for a user
  function renderFeaturedProjects() {
    if (
      cookies.user.userHandle === profileUser &&
      featuredProjects.length > 0
    ) {
      return (
        <>
          <h2>Featured Projects</h2>
          <div className="featured-project-placeholder">
            <div>
              {featuredProjects.map((featuredProjectInfo) => (
                <FeaturedProject
                  key={featuredProjectInfo.id}
                  featuredProjectInfo={featuredProjectInfo}
                />
              ))}
            </div>
          </div>
        </>
      );
    } else if (cookies.user.userHandle === profileUser) {
      return (
        <>
          <h2>Featured Projects</h2>
          <div className="featured-project-placeholder">
            <div
              className="add-featured"
              onClick={() => navigate("/create-featured")}
            >
              <i class="fa-solid fa-plus"></i>
            </div>
          </div>
        </>
      );
    }
  }

  /***
   * Updates the amount of time a user spends interacting with a post by adding a second to the timer.
   */
  function updateTimer() {
    if (document.visibilityState === "visible") {
      timer = timer + 1;
    }
  }

  /***
   * Logs an interaction.
   * Called when the user just before the user navigates away from the page.
   */
  function logInteraction() {
    if (cookies.user.id !== profileUserData.id) {
      const interactionInfo = {
        interactionDuration: timer,
        date: date,
        timestamp: timestamp,
        viewedProfile: true,
        viewedPost: false,
        postID: null,
        interactingUserID: cookies.user.id,
        targetUserID: profileUserData.id,
      };

      createInteraction(interactionInfo);
    }
  }

  // Retrieve data upon page reload & cookies change.
  useEffect(() => {
    async function loadData() {
      const loadedProfileUserData = await getUserData(profileUser);
      await setProfileUserData(loadedProfileUserData);
      await setProfilePicture(
        <img
          className="main-profile-picture"
          src={loadedProfileUserData.profilePicture}
        />
      );

      await setFeaturedProjects(loadedProfileUserData.featuredProjects);

      const userPosts = await getUserPosts(loadedProfileUserData.id);
      await setUserPosts(userPosts);

      const loadedConnectionStatus = await getConnectionStatus(
        cookies.user.id,
        loadedProfileUserData.id
      );

      await setConnectionStatus(loadedConnectionStatus);
    }

    loadData().then(() => setIsLoading(false));
  }, [cookies, connectionStatus]);

  setInterval(() => {
    updateTimer();
  }, 1000);

  window.onbeforeunload = logInteraction; // Calls logInteraction() before navigating away from page.

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
              <h2 className="user-handle">@{profileUser}</h2>
              <a
                href={`https://www.github.com/${profileUserData.githubHandle}`}
              >
                <section className="profile-link">
                  {" "}
                  <i className="fa-brands fa-github"></i> GitHub
                </section>
              </a>
              <section className="profile-link">
                <i className="fa-brands fa-linkedin"></i> LinkedIn
              </section>
              {profileInfo()}
              {renderFeaturedProjects()}
              <div>
                <h2>Posts</h2>
                <div className="posts">
                  {userPosts.map((postInfo) => (
                    <Post key={postInfo.id} postInfo={postInfo} />
                  ))}
                </div>
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
