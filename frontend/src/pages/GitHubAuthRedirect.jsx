import { useState } from "react";
import { githubAuthentication } from "./util/auth";

function GitHubAuthRedirect() {
  githubAuthentication();

  return (
    <>
      <div>
        <h1>Authenticating...</h1>
      </div>
    </>
  );
}

export default GitHubAuthRedirect;
