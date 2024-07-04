import "./stylesheets/Post.css";

function Post(postInfo) {
  return (
    <>
      <div className="post">
        <h1>{postInfo.postInfo.title}</h1>
        <p>{postInfo.postInfo.text}</p>
        <p className="date-time">{postInfo.postInfo.date}</p>
        <p className="date-time">{postInfo.postInfo.timestamp}</p>
        <p>Upvotes: {postInfo.postInfo.upvotes}</p>
      </div>
    </>
  );
}

export default Post;
