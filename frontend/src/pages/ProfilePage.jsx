import { useCookies } from "react-cookie";
import { getUserData, getUserPosts } from "./util/posts";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Post from "../components/Post";
import FeaturedProject from "../components/FeaturedProject";
import LoadingPage from "./LoadingPage";

import "./stylesheets/ProfilePage.css";

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

function ProfilePage() {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [profileUserData, setProfileUserData] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
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
          <div> </div>
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
