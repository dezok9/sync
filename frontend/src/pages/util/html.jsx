import ProfilePicture from "../../../assets/ProfilePicture.png";

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
