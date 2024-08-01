import { useState } from "react";

import "./stylesheets/Popup.css";

function Popup(popupInfo) {
  const [popupVisibility, setPopupVisibility] = useState(true);

  return (
    <>
      <div className={"popup"}>{popupInfo.errorMessage}</div>
    </>
  );
}

export default Popup;
