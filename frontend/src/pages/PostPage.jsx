import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import {
  getPost,
  generateDateTimestamp,
  createComment,
  getUserDataID,
  deriveTimeSincePost,
} from "./util/posts";
import {
  renderPostTextHelper,
  renderProfilePicture,
  renderTLDR,
} from "./util/html";
import { createInteraction } from "./util/interactions";
import { USER } from "./util/enums";

import "./stylesheets/PostPage.css";
import LoadingPage from "./LoadingPage";
import CommentFamily from "../components/CommentFamily";

// Gets the postID from the URL to allow for more dynamic lookup via the URL.
const postURL = window.location.href.split("/");
const postID = postURL[postURL.length - 1];

function Post() {
  const [cookies, setCookies, removeCookies] = useCookies([USER]);

  // Use states for comments.
  const [isLoading, setIsLoading] = useState(true);
  const [postData, setPostData] = useState({});
  const [commentData, setCommentData] = useState([]);
  const [postAuthorData, setPostAuthorData] = useState([]);
  const [commentText, setCommentText] = useState("");

  const { date, timestamp } = generateDateTimestamp();
  let timer = 0; // Amount of time the user has spent on the post page in seconds

  /***
   * Helper function for commenting on a post.
   */
  function makeComment() {
    const { date, timestamp } = generateDateTimestamp();

    const commentData = {
      date: date,
      timestamp: timestamp,
      commentText: commentText,
      parentCommentID: null,
      postID: postID,
      authorID: cookies.user.id,
    };

    createComment(commentData);
  }

  /***
   * Funciton for updating the user's comment
   */
  function handleCommentChange(event) {
    setCommentText(event.target.value);
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
    if (cookies.user.id !== postAuthorData.id) {
      const interactionInfo = {
        interactionDuration: timer,
        date: date,
        timestamp: timestamp,
        viewedProfile: false,
        viewedPost: true,
        postID: Number(postID),
        interactingUserID: cookies.user.id,
        targetUserID: postAuthorData.id,
      };

      createInteraction(interactionInfo);
    }
  }

  /***
   * Renders comments for post.
   */
  function renderComments() {
    if (commentData.length === 0) {
      return <div>Such void...</div>;
    } else {
      const commentFamilies = [];
      const commentParents = commentData.filter(
        (comment) => !comment.parentCommentID
      );

      for (const index in commentParents) {
        const parent = commentParents[index];
        const children = commentData.filter(
          (comment) => comment.parentCommentID === parent.id
        );
        const family = [parent, children];

        commentFamilies.push(family);
      }

      return (
        <div>
          {commentFamilies.map((commentFamily) => (
            <CommentFamily commentFamily={commentFamily} />
          ))}
        </div>
      );
    }
  }

  useEffect(() => {
    async function loadData() {
      const loadedPostData = await getPost(postID);
      await setPostData(loadedPostData);
      await setCommentData(loadedPostData.comments);

      const loadedAuthorData = await getUserDataID(loadedPostData.authorID);
      await setPostAuthorData(loadedAuthorData);
    }

    loadData().then(() => setIsLoading(false));
  }, [cookies]);

  setInterval(() => {
    updateTimer();
  }, 1000);

  window.onbeforeunload = logInteraction; // Calls logInteraction() before navigating away from page.

  if (isLoading) {
    return <>{<LoadingPage />}</>;
  } else {
    return (
      <div className="post">
        <div>{renderProfilePicture(postAuthorData.profilePicture)}</div>
        <h3>
          {postAuthorData.firstName} {postAuthorData.lastName}
        </h3>
        <h5>@{postAuthorData.userHandle}</h5>
        <p className="date-time">
          {deriveTimeSincePost(postData.date, postData.timestamp)}
        </p>

        <h2>{postData.title}</h2>
        <div>{renderTLDR(postData.tldr)}</div>
        <p>{renderPostTextHelper(postData.text)}</p>

        <div>
          <input
            placeholder="Add to the conversation..."
            value={commentText}
            onChange={(event) => handleCommentChange(event)}
          ></input>
          <button onClick={() => makeComment()}>Comment</button>
        </div>
        <div>
          <h3>Comments</h3>
          {renderComments()}
        </div>
      </div>
    );
  }
}

export default Post;
