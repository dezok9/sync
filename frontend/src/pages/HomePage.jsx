import { Cookies, useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getFeed,
  getUserData,
  createPost,
  generateDateTimestamp,
} from "./util/posts";
import { getRecommendedPosts } from "./util/posts";
import { USER, TITLE, TEXT, MEDIA, TAGS } from "./util/enums";
import Post from "../components/Post";
import LoadingPage from "./LoadingPage";
import homeFeedTab from "../../assets/HomeFeedTab.png";
import recommendedFeedTab from "../../assets/RecommendedFeedTab.png";

import "./stylesheets/HomePage.css";

function HomePage() {
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
   *  Changes between the feeds of recommended and featured.
   */
  function handleFeedType() {
    setfeedType(!feedType);
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

    loadData();
    setIsLoading(setIsLoading(false));
  }, [cookies]);

  if (isLoading) {
    return <LoadingPage />;
  } else {
    return (
      <>
        <img className="hide" src={homeFeedTab}></img>
        <img className="hide" src={recommendedFeedTab}></img>
        <div className="home">
          <div className="home-page page">
            <h1>Home</h1>
            <h3>{`Welcome, ${userData.firstName}`}</h3>
            <button onClick={handleModalView}>Create Post</button>

            <section className="feed">
              <div className="featured-feed">
                {homeFeedData.map((postData) => (
                  <Post key={postData.id} postInfo={postData} />
                ))}
              </div>
              <h3>Recommended Posts</h3>
              <div className="recommended-feed">
                {recommendedFeedData.map((recommendedPostData) => (
                  <Post
                    key={recommendedPostData.id}
                    postInfo={recommendedPostData}
                  />
                ))}
              </div>
            </section>
          </div>

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
