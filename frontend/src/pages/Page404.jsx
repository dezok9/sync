import { useNavigate } from "react-router-dom";

function Page404() {
  const navigate = useNavigate();

  return (
    <>
      <div className="page">
        <div>Page Not Found</div>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    </>
  );
}

export default Page404;
