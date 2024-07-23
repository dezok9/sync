import { CODE_OPENER, CODE_CLOSER } from "./enums";
import { useEffect, useRef } from "react";

import ProfilePicture from "../../../assets/ProfilePicture.png";

import "./stylesheets/html.css";

/***
 * Returns a rendered profile picture if the user has one uploaded.
 */
export function renderProfilePicture(profilePictureURL) {
  if (profilePictureURL === "") {
    return (
      <>
        <img style={{ width: "10%" }} src={ProfilePicture}></img>
      </>
    );
  } else {
    return (
      <>
        <img src={profilePictureURL}></img>
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
      <>
        <p className="code-block">{splitText[0].replace("<>", "")}</p>
        <p>{splitText[1]}</p>
      </>
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
      <>
        <h3 className="tldr">TL;DR</h3>
        <p>{tldr}</p>
      </>
    );
  }
}

/***
 *
 */
export const UploadWidget = () => {
  const cloudinaryRef = useRef();
  const widgetRef = useRef();
  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
    widgetRef.current = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: "dkf1m1xpw",
        uploadPreset: "sync-app",
      },
      function (error, result) {}
    );
  }, []);

  return <button onClick={() => widgetRef.current.open()}>Upload</button>;
};
