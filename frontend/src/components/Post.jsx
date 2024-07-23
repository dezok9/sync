import { useCookies } from "react-cookie";
import {
  upvotePost,
  removeUpvote,
  deriveTimeSincePost,
} from "../pages/util/posts";
import { useNavigate } from "react-router-dom";
import { USER } from "../pages/util/enums";
import { useState, useEffect } from "react";
import {
  renderProfilePicture,
  renderPostText,
  renderTLDR,
} from "../pages/util/html";
import { CODE_OPENER, CODE_CLOSER } from "../pages/util/enums";

import "./stylesheets/Post.css";

function Post(postInfo) {
  const [cookies, setCookies, removeCookies] = useCookies([USER]);
  const [upvotes, setUpvotes] = useState(postInfo.postInfo.upvoteCount);

  const navigate = useNavigate();

  /***
   * Hanldes upvoting or downvoting a post.
   */
  function handleUpvote() {
    if (postInfo.postInfo.authenticatedUpvoted) {
      removeUpvote(postInfo.postInfo.id, cookies.user.id);
    } else {
      upvotePost(postInfo.postInfo.id, cookies.user.id);
    }
  }

  return (
    <>
      <div
        className="post"
        onClick={() => navigate(`/post/${postInfo.postInfo.id}`)}
      >
        <div className="author">
          {renderProfilePicture(postInfo.postInfo.authorData.profilePicture)}
          <div className="author-info">
            <h4>
              {postInfo.postInfo.authorData.firstName}{" "}
              {postInfo.postInfo.authorData.lastName}
            </h4>
            <h5>@{postInfo.postInfo.authorData.userHandle}</h5>
            <p className="date-time">
              {deriveTimeSincePost(
                postInfo.postInfo.date,
                postInfo.postInfo.timestamp
              )}
            </p>
          </div>
        </div>

        <h1>{postInfo.postInfo.title}</h1>
        <div>{renderTLDR(postInfo.postInfo.tldr)}</div>
        <div>
          {postInfo.postInfo.text
            .split(CODE_OPENER)
            .map((textSegment) => renderPostText(textSegment))}
        </div>
        <p>
          <i
            className="fa-solid fa-arrow-up upvote"
            onClick={(event) => {
              handleUpvote();
              event.stopPropagation();
              setUpvotes(upvotes + 1);
            }}
          ></i>{" "}
          Upvotes: {upvotes}
        </p>
      </div>
    </>
  );
}

export default Post;
