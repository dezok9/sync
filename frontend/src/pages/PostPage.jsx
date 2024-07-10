import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import {
  comment,
  getPost,
  getUserData,
  generateDateTimestamp,
} from "./util/posts";

import "./stylesheets/PostPage.css";

// Gets the postID from the URL to allow for more dynamic lookup via the URL.
const postURL = window.location.href.split("/");
const postID = postURL[postURL.length - 1];

function Post() {
  const [isLoading, setIsLoading] = useState(true);
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [authenticatedUserData, setAuthenticatedUserData] = useState([]);
  const [postData, setPostData] = useState([]);
  const [postAuthorData, setPostAuthorData] = useState([]);
  const [commentText, setCommentText] = useState("");

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

    comment(commentData);
  }

  /***
   * Funciton for updating the user's comment
   */
  function handleCommentChange(event) {
    setCommentText(event.target.value);
  }

  useEffect(() => {
    async function loadData() {
      const postData = await getPost(postID);
      setPostData(postData);

      const authenticatedUserData = await getUserData(cookies.user.userHandle);
      setAuthenticatedUserData(authenticatedUserData);
    }

    loadData();
    setIsLoading(false);
  }, [cookies]);

  return (
    <div className="post">
      <h2>{postData.title}</h2>
      <p>{postData.text}</p>

      <div>
        <input
          placeholder="Add to the conversation..."
          value={commentText}
          onChange={(event) => handleCommentChange(event)}
        ></input>
        <button onClick={() => makeComment()}>Comment</button>
      </div>
    </div>
  );
}

export default Post;
