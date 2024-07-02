import "./stylesheets/HomePage.css";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);

  /***
   * Helper function for logging out.
   */
  function logOut() {
    removeCookies("user");
    navigate("/login");
  }

  return (
    <>
      <div className="home-page">
        <h1>Home</h1>
        <h3>{`Welcome, ${cookies.user.firstName}`}</h3>
        <button onClick={logOut}>Log Out</button>
        <section className="feed"></section>
      </div>
    </>
  );
}

export default HomePage;
