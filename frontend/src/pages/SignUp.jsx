import { useState, useEffect } from "react";
import { login } from "./util/login";

import Header from "../components/Header";
import Footer from "../components/Footer";

import "./stylesheets/SignUp.css";

function SignUp() {
  const FIRSTNAME = "firstName";
  const LASTNAME = "lastName";
  const USERHANDLE = "userHandle";
  const EMAIL = "email";
  const GITHUB = "githubHandle";
  const PASSWORD = "password";
  const CONFIRM = "confirmPassword";

  // Use states for login contained in one object.
  const [loginInfo, setLoginInfo] = useState({
    [FIRSTNAME]: "",
    [LASTNAME]: "",
    [USERHANDLE]: "",
    [EMAIL]: "",
    [GITHUB]: "",
    [PASSWORD]: "",
    [CONFIRM]: "",
  });

  /***
   * Handles changes to input fields.
   */
  function handleInputChange(event) {
    const id = event.target.id;
    console.log(id);

    setLoginInfo((prvs) => ({ ...prvs, id: event.target.value }));
  }

  return (
    <>
      <section className="inputs">
        <div className="input-section">
          <h2>First Name</h2>
          <input
            id={FIRSTNAME}
            className="input"
            value={loginInfo.FIRSTNAME}
            onChange={handleInputChange}
            autoFocus={true}
          ></input>
        </div>
        <div className="input-section">
          <h2>Last Name</h2>
          <input
            id={LASTNAME}
            className="input"
            value={loginInfo.LASTNAME}
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
            id={USERHANDLE}
            className="input"
            value={loginInfo.USERHANDLE}
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
            id={CONFIRM}
            className="input"
            type="password"
            value={loginInfo.CONFIRM}
            onChange={handleInputChange}
          ></input>
        </div>
        <button onClick={(user, password) => login}>Submit</button>
      </section>
    </>
  );
}

export default SignUp;
