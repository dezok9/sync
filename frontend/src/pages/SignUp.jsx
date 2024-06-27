import { useState, useEffect } from "react";
import { login } from "./util/login";

import Header from "../components/Header";
import Footer from "../components/Footer";

import "./stylesheets/SignUp.css";

function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userHandle, setUserHandle] = useState("");
  const [email, setEmail] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /***
   * Handles changes to input fields.
   */
  function handleInputChange(event) {
    if (event.target.id === "firstName-field") {
      setFirstName(event.target.value);
    } else if (event.target.id === "lastName-field") {
      setLastName(event.target.value);
    } else if (event.target.id === "userHandle-field") {
      setUserHandle(event.target.value);
    } else if (event.target.id === "email-field") {
      setEmail(event.target.value);
    } else if (event.target.id === "githubHandle-field") {
      setGithubHandle(event.target.value);
    } else if (event.target.id === "password-field") {
      setPassword(event.target.value);
    } else if (event.target.id === "confirmPassword-field") {
      setConfirmPassword(event.target.value);
    }
  }

  return (
    <>
      <section className="inputs">
        <div className="input-section">
          <h2>First Name</h2>
          <input
            id="firstName-field"
            className="input"
            value={firstName}
            onChange={handleInputChange}
            autoFocus={true}
          ></input>
        </div>
        <div className="input-section">
          <h2>Last Name</h2>
          <input
            id="lastName-field"
            className="input"
            value={lastName}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>Email</h2>
          <input
            id="email-field"
            className="input"
            inputMode="email"
            value={email}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>User Handle</h2>
          <input
            id="userHandle-field"
            className="input"
            value={userHandle}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>GitHub Handle</h2>
          <input
            id="githubHandle-field"
            className="input"
            value={githubHandle}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>Password</h2>
          <input
            id="password-field"
            className="input"
            type="password"
            value={password}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="input-section">
          <h2>Confirm Password</h2>
          <input
            id="confirmPassword-field"
            className="input"
            type="password"
            value={confirmPassword}
            onChange={handleInputChange}
          ></input>
        </div>
        <button onClick={(user, password) => login}>Submit</button>
      </section>
    </>
  );
}

export default SignUp;
