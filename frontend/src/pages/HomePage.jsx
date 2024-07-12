import { Cookies, useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getFeed,
  getUserData,
  createPost,
  generateDateTimestamp,
} from "./util/posts";
import Post from "../components/Post";
import LoadingPage from "./LoadingPage";

import "./stylesheets/HomePage.css";

function HomePage() {
  // Enums for post and feed data.
  const TITLE = "title";
  const TEXT = "text";
  const MEDIA = "media";
  const TAGS = "tags";

  // Modal useStates.
  const [modalOpen, setModalOpen] = useState(false);
  const [postContent, setPostContent] = useState({
    [TITLE]: "",
    [TEXT]: "",
    [MEDIA]: [],
    [TAGS]: [],
  });
  const [titleInvalidWarning, setTitleInvalidWarning] = useState(false);
  const [textInvalidWarning, setTextInvalidWarning] = useState(false);

  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [feedData, setFeedData] = useState([]);

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

    if (modalOpen) {
      postContent[TEXT] = "";
      postContent[TITLE] = "";
      postContent[MEDIA] = [];
      postContent[TAGS] = [];
      setTitleInvalidWarning(false);
      setTextInvalidWarning(false);
    }
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
    const { date, timestamp } = generateDateTimestamp();

    // Call util function if fields valid.
    const postInfo = {
      title: postContent[TITLE],
      text: postContent[TEXT],
      authorID: userData.id,
      mediaURLs: postContent[MEDIA],
      date: date,
      timestamp: timestamp,
    };

    if (postContent[TITLE].replace(" ", "") === "") {
      setTitleInvalidWarning(true);
    } else {
      setTitleInvalidWarning(false);
    }

    if (postContent[TEXT].replace(" ", "") === "") {
      setTextInvalidWarning(true);
    } else {
      setTextInvalidWarning(false);
    }

    if (textInvalidWarning || titleInvalidWarning) {
      return;
    }

    createPost(postInfo);
    handleModalView();
  }

  // Retrieve data upon page reload & cookies change.
  useEffect(() => {
    async function loadData() {
      // Retrieve data for the authenticated user.
      const loadedUserData = await getUserData(cookies.user.userHandle);
      await setUserData(loadedUserData);

      const loadedFeedData = await getFeed(cookies.user.id);
      await setFeedData(loadedFeedData);
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
          <section className="feed">
            {feedData.map((postData) => (
              <Post key={postData.id} postInfo={postData[0]} />
            ))}
          </section>

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
              <p
                className={"warning " + (titleInvalidWarning ? "show" : "hide")}
              >
                Title of post can't be empty
              </p>
            </div>
            <div>
              <input
                id={TEXT}
                className="modal-input body-input"
                placeholder="Get in sync with others..."
                value={postContent[TEXT]}
                onChange={handleInputChange}
              ></input>
              <p
                className={"warning " + (textInvalidWarning ? "show" : "hide")}
              >
                Body of post can't be empty
              </p>
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
