import { Cookies, useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getFeed, getUserData, createPost } from "./util/posts";
import Post from "../components/Post";
import LoadingPage from "./LoadingPage";

import "./stylesheets/HomePage.css";

// Helper asynchronous functions.

/***
 * Helper function for asynchronously retrieving user data.
 */
async function loadUserData(userHandle) {
  const userData = await getUserData(userHandle);
  return userData;
}

/***
 * Helper function for asyncronously retrieving post data for feed.
 */
async function loadFeedData(userID) {
  const feedPostsData = await getFeed(userID);
  return feedPostsData;
}

// Default function.

function HomePage() {
  // Enums for post and feed data.
  const TITLE = "title";
  const TEXT = "text";
  const MEDIA = "media";

  // Modal useStates.
  const [modalOpen, setModalOpen] = useState(false);
  const [postContent, setPostContent] = useState({
    [TITLE]: "",
    [TEXT]: "",
    [MEDIA]: [],
  });

  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [feedData, setFeedData] = useState({});

  const navigate = useNavigate();

  /***
   * Helper function for logging out.
   */
  function logOut() {
    removeCookies("user", { path: "/" });
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
   * Helper function to be mapped to for rendering posts.
   * Calls on the post component.
   */
  function renderPosts() {
    return <></>;
  }

  /***
   *  Helper function for creating posts.
   */
  function handlePost() {
    // Generate date and timestamp.
    const MONTHS = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dateObject = new Date();

    const month = dateObject.getMonth();
    const day = dateObject.getDate();
    const year = dateObject.getFullYear();

    const hours = dateObject.getHours();
    const minutes = dateObject.getMinutes();
    const seconds = dateObject.getSeconds();

    const date = [MONTHS[month], day + ",", year].join(" ");

    const timestamp = [
      hours,
      minutes,
      (seconds.toString().length == 2 ? "" : "0") + seconds,
    ].join(":");

    // Call util function.
    const postInfo = {
      title: postContent[TITLE],
      text: postContent[TEXT],
      authorID: userData.id,
      mediaURLs: postContent[MEDIA],
      date: date,
      timestamp: timestamp,
    };

    createPost(postInfo);
  }

  // Retrieve data upon page reload & cookies change.
  useEffect(() => {
    async function loadData() {
      // Retrieve data for the authenticated user.
      const loadedUserData = await loadUserData(cookies.user.userHandle);
      await setUserData(loadedUserData);

      const loadedFeedData = await loadFeedData(cookies.user.id);
      await setFeedData(loadedFeedData);
      // Retrieve data for the feed of the authenticated user.
    }

    loadData();
    setIsLoading(setIsLoading(false));
  }, [cookies]);

  if (isLoading) {
    return <LoadingPage />;
  } else {
    return (
      <>
        <button onClick={() => navigate(`/profile/${cookies.user.userHandle}`)}>
          Profile
        </button>
        <div className="home-page">
          <h1>Home</h1>
          <h3>{`Welcome, ${userData.firstName}`}</h3>
          <button onClick={() => logOut()}>Log Out</button>
          <button onClick={handleModalView}>Create Post</button>
          <section className="feed">{renderPosts()}</section>

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
                id={TEXT}
                className="modal-input body-input"
                placeholder="Get in sync with others..."
                value={postContent[TEXT]}
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
}

export default HomePage;
