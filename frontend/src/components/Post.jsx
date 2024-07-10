import { useCookies } from "react-cookie";
import { upvotePost } from "../pages/util/posts";
import { useNavigate } from "react-router-dom";
import "./stylesheets/Post.css";
import { useState } from "react";

function Post(postInfo) {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);
  const [upvotes, setUpvotes] = useState(postInfo.postInfo.upvoteCount);

  const navigate = useNavigate();

  /***
   * Hanldes upvoting a post.
   */
  function handleUpvote(event) {
    event.stopPropagation();
    upvotePost(
      postInfo.postInfo.id,
      cookies.user.id,
      postInfo.postInfo.upvoteCount + 1
    );
  }

  return (
    <>
      <div
        className="post"
        onClick={() => navigate(`/post/${postInfo.postInfo.id}`)}
      >
        <h1>{postInfo.postInfo.title}</h1>
        <p>Author ID: {postInfo.postInfo.authorID}</p>
        <p>{postInfo.postInfo.text}</p>
        <p className="date-time">{postInfo.postInfo.date}</p>
        <p className="date-time">{postInfo.postInfo.timestamp}</p>
        <p>
          <i
            className="fa-solid fa-arrow-up upvote"
            onClick={() => {
              upvotePost(
                postInfo.postInfo.id,
                cookies.user.id,
                postInfo.postInfo.upvoteCount + 1
              );
            }}
          ></i>{" "}
          Upvotes: {upvotes}
        </p>
        <div>
          <h3>Comments:</h3>
        </div>
      </div>
    </>
  );
}

export default Post;
