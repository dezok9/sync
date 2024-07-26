import { useState } from "react";
import "./stylesheets/CookiesQuestion.css";

function CookiesQuestion() {
  const [acceptedCookies, setAcceptedCookies] = useState(false);

  /***
   * Accepts the use of cookies.
   */
  function acceptCookies() {
    setAcceptedCookies(true);
  }

  /***
   * Rejects the use of cookies and navigates away.
   */
  function rejectCookies() {
    window.location.assign("https://google.com");
  }

  return (
    <div className={"cookies-popup " + (acceptedCookies ? "hide" : "show")}>
      Do you accept to the use of cookies? 🍪
      <div>
        <button onClick={() => acceptCookies()}>Yes</button>
        <button onClick={() => rejectCookies()}>No</button>
      </div>
    </div>
  );
}

export default CookiesQuestion;
