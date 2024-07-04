import { useCookies } from "react-cookie";
import { getUserData } from "./util/posts";
import { useState, useEffect } from "react";
import FeaturedProject from "../components/FeaturedProject";
import LoadingPage from "./LoadingPage";

import "./stylesheets/ProfilePage.css";

// Gets username from URL to allow for more dynamic lookup via the URL.
const profileURL = window.location.href.split("/");
const profileUser = profileURL[profileURL.length - 1];

/***
 * Helper function for asyncronously loading user data.
 */
async function loadUserData() {
  const userData = await getUserData(profileUser);
  return userData;
}

const ProfilePage = () => {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [userData, setUserData] = useState({});
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /***
   * Retrieves the profile picture from the database information.
   * If user has no profile picture, inserts a placeholder.
   */
  function getProfilePicture() {
    if (userData.profilePicture !== "") {
      return (
        <>
          <img src={userData.profilePicture} />
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
   * Gets featured posts for a user and returns the formatted data in a FeaturedPosts component.
   */
  function getFeaturedProject(featuredProjectData) {
    return <FeaturedPost featuredProjectData={featuredProjectData} />;
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
      const userData = await loadUserData(cookies.user);
      await setUserData(userData);
      userData.featuredProjects.map((featuredProject) => getFeaturedPost);
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
              <h1>{userData.firstName + " " + userData.lastName}</h1>
              <h2>@{profileUser}</h2>
              {profileInfo()}
            </div>
          </section>
          <section className="featured-post">{featuredProjects}</section>
        </div>
      </>
    );
  }
};

export default ProfilePage;
