import { useState } from "react";
import { handleSignUp } from "./util/loginSignUp";
import { useNavigate } from "react-router-dom";

import "./stylesheets/SignUpPage.css";

function SignUpPage() {
  const navigate = useNavigate();

  const FIRST_NAME = "firstName";
  const LAST_NAME = "lastName";
  const USER_HANDLE = "userHandle";
  const EMAIL = "email";
  const GITHUB = "githubHandle";
  const PASSWORD = "password";
  const CONFIRM_PASSWORD = "confirmPassword";

  // Use states for login contained in one object.
  const [loginInfo, setLoginInfo] = useState({
    [FIRST_NAME]: "",
    [LAST_NAME]: "",
    [USER_HANDLE]: "",
    [EMAIL]: "",
    [GITHUB]: "",
    [PASSWORD]: "",
    [CONFIRM_PASSWORD]: "",
  });

  /***
   * Handles changes to input fields.
   */
  function handleInputChange(event) {
    const inputID = event.target.id;
    setLoginInfo((prvs) => ({ ...prvs, [inputID]: event.target.value }));
  }

  /***
   * Helper function that creates a new account for the user.
   * Navigates to the login page  on successful account creation.
   */
  async function signUp() {
    const userCreated = await handleSignUp(loginInfo);

    if (userCreated) {
      navigate("/login");
    }
  }

  return (
    <>
      <section className="auth-pages">
        <div className="input-section">
          <h2>First Name</h2>
          <input
            id={FIRST_NAME}
            className="input"
            value={loginInfo.FIRST_NAME}
            onChange={handleInputChange}
            autoFocus={true}
          ></input>
        </div>
        <div className="input-section">
          <h2>Last Name</h2>
          <input
            id={LAST_NAME}
            className="input"
            value={loginInfo.LAST_NAME}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>Email</h2>
          <input
            id={EMAIL}
            className="input"
            inputMode="email"
            value={loginInfo.EMAIL}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>User Handle</h2>
          <input
            id={USER_HANDLE}
            className="input"
            value={loginInfo.USER_HANDLE}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>GitHub Handle</h2>
          <input
            id={GITHUB}
            className="input"
            value={loginInfo.GITHUB}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>Password</h2>
          <input
            id={PASSWORD}
            className="input"
            type="password"
            value={loginInfo.PASSWORD}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>Confirm Password</h2>
          <input
            id={CONFIRM_PASSWORD}
            className="input"
            type="password"
            value={loginInfo.CONFIRM_PASSWORD}
            onChange={handleInputChange}
          ></input>
        </div>
        <p>
          Already have an account?{" "}
          <button onClick={() => navigate("/login")}>Log in</button> instead.
        </p>
        <button onClick={signUp}>Submit</button>
      </section>
    </>
  );
}

export default SignUpPage;
