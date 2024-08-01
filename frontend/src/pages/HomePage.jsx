import { USER, TITLE, TEXT, MEDIA, TAGS, TLDR } from "./util/enums";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getFeed,
  getUserData,
  createPost,
  generateDateTimestamp,
  getRecommendedPosts,
} from "./util/posts";
import { validateCodeInjection } from "./util/homepage";
import { UploadWidget } from "./util/html";

import Post from "../components/Post";
import LoadingPage from "./LoadingPage";
import CookiesQuestion from "../components/CookiesQuestion";

import HomeFeedTab from "../../assets/HomeFeedTab.svg";
import RecommendedFeedTab from "../../assets/RecommendedFeedTab.svg";

import "./stylesheets/HomePage.css";

function HomePage() {
  // Modal useStates.
  const [modalOpen, setModalOpen] = useState(false);
  const [postContent, setPostContent] = useState({
    [TITLE]: "",
    [TEXT]: "",
    [TLDR]: "",
    [MEDIA]: [],
    [TAGS]: [],
  });
  const [titleInvalidWarning, setTitleInvalidWarning] = useState(false);
  const [textInvalidWarning, setTextInvalidWarning] = useState(false);
  const [codeTextInvalidWarning, setCodeTextInvalidWarning] = useState(false);

  const [cookies, setCookies, removeCookies] = useCookies([USER]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [homeFeedData, setHomeFeedData] = useState([]);
  const [recommendedFeedData, setRecommendedFeedData] = useState([]);
  const [feedType, setFeedType] = useState(false); // Toggles between recommended feed and feed of posts by connections. False is default feed of posts by connections.

  const navigate = useNavigate();

  const LEN_RECOMMENDED_FEED = 5;

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
    const { date, timestamp } = generateDateTimestamp();

    // Call util function if fields valid.
    const postInfo = {
      title: postContent[TITLE].trim(),
      text: postContent[TEXT].trim(),
      tldr: postContent[TLDR].trim(),
      authorID: userData.id,
      mediaURLs: postContent[MEDIA],
      date: date,
      timestamp: timestamp,
    };

    if (postContent[TITLE].replace(" ", "") === "") {
      setTitleInvalidWarning(true);
      return;
    } else {
      setTitleInvalidWarning(false);
    }

    if (postContent[TEXT].replace(" ", "") === "") {
      setTextInvalidWarning(true);
      return;
    } else {
      setTextInvalidWarning(false);
    }

    if (!validateCodeInjection(postContent[TEXT])) {
      setCodeTextInvalidWarning(true);
      return;
    }

    createPost(postInfo);

    // Reset modal values.
    postContent[TEXT] = "";
    postContent[TITLE] = "";
    postContent[TLDR] = "";
    postContent[MEDIA] = [];
    postContent[TAGS] = [];
    setTitleInvalidWarning(false);
    setTextInvalidWarning(false);
    setCodeTextInvalidWarning(false);

    handleModalView();
  }

  /***
   * Toggles between two feeds.
   */
  function toggleFeeds(event) {
    if (event.target.className.includes("recommended")) {
      setFeedType(true);
    } else {
      setFeedType(false);
    }
  }

  /***
   * Renders the recommended feed or a placeholder.
   */
  function renderRecommendedFeed() {
    if (recommendedFeedData.length > 0) {
      return (
        <div className="posts">
          {recommendedFeedData.map((recommendedPostData) => (
            <Post key={recommendedPostData.id} postInfo={recommendedPostData} />
          ))}
        </div>
      );
    } else {
      return (
        <>
          <h3 className="placeholder-feed">
            Connect with users to recieve more relevant recommended posts.
          </h3>
        </>
      );
    }
  }

  /***
   * Returns the home feed for the homepage.
   * Renders the home feed or a placeholder.
   */
  function renderHomeFeed() {
    if (homeFeedData.length > 0) {
      return (
        <div className="posts">
          {homeFeedData.map((postData) => (
            <Post key={postData.id} postInfo={postData} />
          ))}
        </div>
      );
    } else {
      return (
        <>
          <h3 className="placeholder-feed">
            Connect with users to recieve more relevant recommended posts to add
            to your feed.
          </h3>
        </>
      );
    }
  }

  /***
   * Renders the media uploaded to a post.
   */
  function renderMedia() {
    if (postContent[MEDIA] !== undefined) {
      postContent[MEDIA].map((mediaURL) => {
        return <img src={postContent[MEDIA]} />;
      });
    }
  }

  // Retrieve data upon page reload & cookies change.
  useEffect(() => {
    async function loadData() {
      const loadedUserData = await getUserData(cookies.user.userHandle);
      await setUserData(loadedUserData);

      const loadedHomeFeedData = await getFeed(cookies.user.id);
      await setHomeFeedData(loadedHomeFeedData);

      const loadedRecommendedFeedData = await getRecommendedPosts(
        cookies.user.id,
        LEN_RECOMMENDED_FEED
      );
      await setRecommendedFeedData(loadedRecommendedFeedData);
    }

    loadData().then(() => setIsLoading(false));
  }, [cookies]);

  if (isLoading) {
    return <LoadingPage />;
  } else {
    return (
      <>
        <button onClick={handleModalView} className="post-button ">
          Create Post
        </button>

        <div className="all">
          <div className="main-page">
            {/* Homepage */}
            <div className="homepage">
              {/* Home Feed */}
              <h1
                className={
                  "home-tab-header " + (feedType ? "active" : "inactive")
                }
                onClick={(event) => toggleFeeds(event)}
              >
                HOME
              </h1>
              <div className={"feed " + (feedType ? "hide" : "show")}>
                <section>{renderHomeFeed()}</section>
              </div>

              {/* Recommended Feed */}
              <h1
                className={
                  "recommended-tab-header " + (feedType ? "inactive" : "active")
                }
                onClick={(event) => toggleFeeds(event)}
              >
                RECOMMENDED
              </h1>
              <div className={"feed " + (feedType ? "show" : "hide")}>
                <section>{renderRecommendedFeed()}</section>
              </div>
            </div>
          </div>

          {/* Post creation modal */}
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
                Title of post can't be empty.
              </p>
            </div>
            <div>
              <input
                id={TLDR}
                className="modal-input body-input"
                placeholder="A short summary (optional)"
                value={postContent[TLDR]}
                onChange={handleInputChange}
              ></input>

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
                Body of post can't be empty.
              </p>
              <p
                className={
                  "warning " + (codeTextInvalidWarning ? "show" : "hide")
                }
              >
                Code brackets are not closed & cannot be nested!
              </p>
            </div>
            <div>
              <p>Media</p>
              {renderMedia()}
              <UploadWidget postContent={postContent} />
            </div>
            <button onClick={handlePost}>Post</button>
          </div>
        </div>

        <CookiesQuestion />
      </>
    );
  }
}

export default HomePage;
