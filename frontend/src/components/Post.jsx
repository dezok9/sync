import { useCookies } from "react-cookie";
import { upvotePost } from "../pages/util/posts";
import "./stylesheets/Post.css";

function Post(postInfo) {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);

  return (
    <>
      <div className="post">
        <h1>{postInfo.postInfo.title}</h1>
        <p>Author ID: {postInfo.postInfo.authorID}</p>
        <p>{postInfo.postInfo.text}</p>
        <p className="date-time">{postInfo.postInfo.date}</p>
        <p className="date-time">{postInfo.postInfo.timestamp}</p>
        <p>
          <i
            className="fa-solid fa-arrow-up upvote"
            onClick={() =>
              upvotePost(
                postInfo.postInfo.id,
                cookies.user.id,
                postInfo.postInfo.upvoteCount + 1
              )
            }
          ></i>{" "}
          Upvotes: {postInfo.postInfo.upvoteCount}
        </p>
      </div>
    </>
  );
}

export default Post;
