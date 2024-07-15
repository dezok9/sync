import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { getPost, generateDateTimestamp, createComment } from "./util/posts";
import { USER } from "./util/enums";

import "./stylesheets/PostPage.css";
import LoadingPage from "./LoadingPage";
import CommentFamily from "../components/CommentFamily";

// Gets the postID from the URL to allow for more dynamic lookup via the URL.
const postURL = window.location.href.split("/");
const postID = postURL[postURL.length - 1];

function Post() {
  const [isLoading, setIsLoading] = useState(true);
  const [cookies, setCookies, removeCookies] = useCookies([USER]);
  const [postData, setPostData] = useState({});
  const [commentData, setCommentData] = useState([]);
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

    createComment(commentData);
  }

  /***
   * Funciton for updating the user's comment
   */
  function handleCommentChange(event) {
    setCommentText(event.target.value);
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
    }

    loadData();
    setIsLoading(false);
  }, [cookies]);

  if (isLoading) {
    return <>{<LoadingPage />}</>;
  } else {
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
        <div>
          <h3>Comments</h3>
          {renderComments()}
        </div>
      </div>
    );
  }
}

export default Post;
