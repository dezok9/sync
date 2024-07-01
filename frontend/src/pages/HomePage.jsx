import "./stylesheets/HomePage.css";
import { useCookies } from "react-cookie";

function HomePage(props) {
  const [cookies, setCookies, removeCookies] = useCookies(["user"]);

  /***
   * Helper function for logging out.
   */
  function logOut() {
    removeCookies("user");
    props.setIsAuthenticated(false);
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
