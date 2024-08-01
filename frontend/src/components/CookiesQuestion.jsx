import { useState } from "react";
import { useCookies } from "react-cookie";
import { ACCEPTED_COOKIES } from "../pages/util/enums";

import "./stylesheets/CookiesQuestion.css";

function CookiesQuestion() {
  const [cookies, setCookies, removeCookies] = useCookies([ACCEPTED_COOKIES]);
  const [acceptedCookies, setAcceptedCookies] = useState(
    cookies.ACCEPTED_COOKIES
  );

  /***
   * Accepts the use of cookies.
   */
  function acceptCookies() {
    setCookies(true);
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
