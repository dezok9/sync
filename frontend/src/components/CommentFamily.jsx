import { useState } from "react";
import { createComment, generateDateTimestamp } from "../pages/util/posts";
import { useCookies } from "react-cookie";
import { USER } from "./../pages/util/enums";

import "./stylesheets/CommentFamily.css";

function CommentFamily(commentFamily) {
  const [cookies, setCookies, removeCookies] = useCookies([USER]);
  const [parentReplyOpen, setParentReplyOpen] = useState(false);
  const [parentReplyText, setParentReplyText] = useState("");

  const parentComment = commentFamily.commentFamily[0];
  const childrenComments = commentFamily.commentFamily[1];

  /***
   * Returns the children comments of the comment family.
   */
  function renderChildComment() {
    if (childrenComments) {
      return childrenComments.map((childComment) => {
        return (
          <div className="children-comments">
            <p>{childComment.commentText}</p>
          </div>
        );
      });
    } else {
      return;
    }
  }

  /***
   * Creates a new reply to a comment.
   */
  function handleCommentReply() {
    if (parentReplyText.replace(" ", "").length !== 0) {
      const { date, timestamp } = generateDateTimestamp();

      const commentData = {
        date: date,
        timestamp: timestamp,
        commentText: parentReplyText,
        parentCommentID: parentComment.id,
        postID: parentComment.postID,
        authorID: cookies.user.id,
      };

      createComment(commentData);
    }
  }

  return (
    <div className="comment-family">
      <div>{parentComment.commentText}</div>
      <p onClick={() => setParentReplyOpen(!parentReplyOpen)}>
        <i>Reply</i>
      </p>
      <div className={"reply-input " + (parentReplyOpen ? "show" : "hide")}>
        <input
          value={parentReplyText}
          onChange={(event) => setParentReplyText(event.target.value)}
        ></input>
        <button onClick={() => handleCommentReply(parentComment.id)}>
          Reply
        </button>
      </div>
      {renderChildComment()}
    </div>
  );
}

export default CommentFamily;
