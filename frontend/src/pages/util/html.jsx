import { CODE_OPENER, CODE_CLOSER, SUCCESS, MEDIA } from "./enums";
import { useState, useEffect, useRef } from "react";
import { updateProfilePicture } from "./user";
import ProfilePicture from "../../../assets/ProfilePicture.png";

import "./stylesheets/html.css";

/***
 * Returns a rendered profile picture if the user has one uploaded.
 */
export function renderProfilePicture(profilePictureURL) {
  if (profilePictureURL === "") {
    return (
      <>
        <img
          className="profile-picture"
          style={{ width: "10%" }}
          src={ProfilePicture}
        ></img>
      </>
    );
  } else {
    return (
      <>
        <img className="profile-picture" src={profilePictureURL}></img>
      </>
    );
  }
}

/***
 * Handles the rednering correctly formatted post text, including code.
 */
export function renderPostText(textSegment) {
  if (textSegment.includes(CODE_CLOSER)) {
    const splitText = textSegment.split(CODE_CLOSER);

    return (
      <div onClick={(event) => event.stopPropagation()}>
        <p className="code-block">{splitText[0].replace("<>", "")}</p>
        <p>{splitText[1]}</p>
      </div>
    );
  } else {
    return (
      <>
        <p>{textSegment}</p>
      </>
    );
  }
}

/***
 * Helper function for rendering formatted post text, including code.
 */
export function renderPostTextHelper(text) {
  if (!text) {
    return;
  }

  return text
    .split(CODE_OPENER)
    .map((textSegment) => renderPostText(textSegment));
}

export function renderTLDR(tldr) {
  if (!tldr) {
    return;
  }

  if (tldr.length > 0) {
    return (
      <div className="tldr-section">
        <h3 className="tldr">TL;DR</h3>
        <p>{tldr}</p>
      </div>
    );
  }
}

/***
 * Renders the widget for uploading photos for posts.
 */
export function UploadWidget(postInfo) {
  const cloudinaryRef = useRef();
  const widgetRef = useRef();
  const [mediaURLs] = useState([]);
  const [mediaCount, setMediaCount] = useState(0);

  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
    widgetRef.current = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: "dkf1m1xpw",
        uploadPreset: "sync-app",
      },

      async function (error, result) {
        if (!error && result && result.event === SUCCESS) {
          mediaURLs.push(await result.info.url);
          postInfo.postContent[MEDIA].push(await result.info.url);
          setMediaCount(mediaURLs.length);
        }
      }
    );
  }, []);

  return (
    <div className="upload-section">
      {mediaURLs.map((mediaURL) => {
        return <img className="thumbnail" src={mediaURL} />;
      })}
      <p>{mediaCount} files uploaded</p>

      <button
        className="upload-button"
        onClick={() => widgetRef.current.open()}
      >
        Upload
      </button>
    </div>
  );
}

/***
 * Renders the widget for uploading profile pictures for posts.
 */
export function ProfilePictureUploadWidget(profileInfo) {
  const cloudinaryRef = useRef();
  const widgetRef = useRef();

  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
    widgetRef.current = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: "dkf1m1xpw",
        uploadPreset: "sync-app",
      },

      async function (error, result) {
        if (!error && result && result.event === SUCCESS) {
          profileInfo.setProfilePicture(
            <img className="main-profile-picture" src={await result.info.url} />
          );
          updateProfilePicture(result.info.url, profileInfo.userID);
        }
      }
    );
  }, []);

  return (
    <div>
      <i
        className="edit-profile-picture fa-solid fa-pen"
        onClick={() => widgetRef.current.open()}
      ></i>
    </div>
  );
}
