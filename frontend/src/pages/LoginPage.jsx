import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleLogin } from "./util/auth";
import { useCookies } from "react-cookie";
import { USER } from "./util/enums";

import Popup from "../components/Popup";

import "./stylesheets/LoginPage.css";

function LoginPage() {
  const [cookies, setCookies, removeCookies] = useCookies([USER]);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true); // Either remembers a user's login information for a week or a day.

  const [errorPopup, setErrorPopup] = useState(<></>);

  const navigate = useNavigate();

  /***
   * Handles changes to input fields.
   */
  function handleInputChange(event) {
    if (event.target.id === "user-field") {
      setUser(event.target.value);
    } else if (event.target.id === "password-field") {
      setPassword(event.target.value);
    }
  }

  /***
   * Handles checking the remember me field.
   */
  function handleRememberMe() {
    setRememberMe(!rememberMe);
  }

  /***
   * Helper function that attempts to log in.
   * Navigates to the homepage on successful log in.
   */
  async function login() {
    if (user.replace(" ", "") !== "" && password.replace(" ", "") !== "") {
      const loginData = await handleLogin(user, password);
      if (loginData) {
        const validLogin = loginData[0];
        const userData = loginData[1];

        if (validLogin) {
          setCookies(USER, userData, {
            path: "/",
            maxAge: rememberMe ? 86400 : 604800,
          });
          navigate("/");
        }
      } else {
        // Incorrect login information.
        setErrorPopup(
          <Popup
            errorMessage={"Incorrect password or account does not exist."}
          />
        );
      }
    } else {
      // All fields have not been filled out.
      setErrorPopup(<Popup errorMessage={"Please fill out all fileds."} />);
    }
  }

  return (
    <>
      {errorPopup}
      <section className="auth-pages">
        <h2>Login</h2>
        <div className="input-section">
          <h2>Username or Email</h2>
          <input
            id="user-field"
            className="input"
            value={user}
            onChange={handleInputChange}
            autoFocus={true}
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
        <div>
          <input
            type="checkbox"
            value={rememberMe}
            onChange={() => handleRememberMe()}
          ></input>
          Remember me
        </div>
        <p>
          Don't have an account?{" "}
          <button onClick={() => navigate("/sign-up")}>Sign up</button> instead.
        </p>
        <button className="submit-button" onClick={login}>
          Login
        </button>
      </section>
    </>
  );
}

export default LoginPage;
