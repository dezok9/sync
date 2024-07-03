import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { Post, useState } from "react";
import { getFeed, getUserData } from "./util/posts";

import "./stylesheets/HomePage.css";

/***
 * Helper function for asynchronously retrieving user data.
 */
async function handleUserData(user) {
  const userData = await getUserData(user);
  return userData;
}

/***
 * Helper function for asyncronously retrieving post data for feed.
 */
async function handleFeed(user) {
  const feedPostsData = await getFeed(user);
  return feedPostsData;
}

function HomePage() {
  // Enums for post and feed data.
  const TITLE = "title";
  const BODY = "body";
  const MEDIA = "media";

  // Modal useStates.
  const [modalOpen, setModalOpen] = useState(false);
  const [postContent, setPostContent] = useState({
    [TITLE]: "",
    [BODY]: "",
    [MEDIA]: "",
  });

  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const userData = handleUserData(cookies.user.userHandle);
  const feedPostsData = handleFeed(cookies.user.userHandle);

  const navigate = useNavigate();

  /***
   * Helper function for logging out.
   */
  function logOut() {
    removeCookies("user");
    navigate("/login");
  }

  /***
   * Toggles the modal view on click.
   */
  function handleModalView() {
    setModalOpen(!modalOpen);
  }

  /***
   *  Handles changes to the input fields of the modal for creating posts.
   */
  function handleInputChange(event) {
    const inputID = event.target.id;
    setPostContent((previousPostContent) => ({
      ...previousPostContent,
      [inputID]: event.target.value,
    }));
  }

  /***
   *  Helper function for creating posts.
   */
  function handlePost() {
    return <Post />;
  }

  return (
    <>
      <button onClick={() => navigate(`/profile/${cookies.user.userHandle}`)}>
        Profile
      </button>
      <div className="home-page">
        <h1>Home</h1>
        <h3>{`Welcome, ${cookies.user.firstName}`}</h3>
        <button onClick={logOut}>Log Out</button>
        <button onClick={handleModalView}>Create Post</button>
        <section className="feed"></section>

        <div className={"modal " + (modalOpen ? "show" : "hide")}>
          <div>
            <h2>Title</h2>
            <input
              id={TITLE}
              className="modal-input"
              placeholder="Title"
              value={postContent[TITLE]}
              onChange={handleInputChange}
            ></input>
          </div>
          <div>
            <input
              id={BODY}
              className="modal-input body-input"
              placeholder="Get in sync with others..."
              value={postContent[BODY]}
              onChange={handleInputChange}
            ></input>
          </div>
          <div>
            <p>Media</p>
          </div>
          <button onClick={handlePost}>Post</button>
        </div>
      </div>
    </>
  );
}

export default HomePage;
