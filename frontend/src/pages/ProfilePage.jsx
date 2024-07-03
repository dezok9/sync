import { useCookies } from "react-cookie";
import { getUserData } from "./util/posts";

import "./stylesheets/ProfilePage.css";
import { useState } from "react";

// Gets username from URL to allow for more dynamic lookup via the URL.
const profileURL = window.location.href.split("/");
const profileUser = profileURL[profileURL.length - 1];
const userData = await getUserData(profileUser);

const ProfilePage = () => {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);

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
  function getFeaturedPosts() {}

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
        <section className="featured-post">{getFeaturedPosts()}</section>
      </div>
    </>
  );
};

export default ProfilePage;
