import SyncGIF from "../../assets/SyncGif.gif";

import "./stylesheets/LoadingPage.css";

function LoadingPage() {
  return (
    <>
      <div className="loading-page">
        <img src={SyncGIF} />
        <p>Loading...</p>
      </div>
    </>
  );
}

export default LoadingPage;
