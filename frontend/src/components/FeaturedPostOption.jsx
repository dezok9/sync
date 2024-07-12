import "./stylesheets/FeaturedProjectOption.css";

function FeaturdProjectOption(featuredPostOptionData) {
  const repository = featuredPostOptionData.repositoryData.repositoryData;

  /***
   * Returns a tag that indicates if the repository is public or private.
   */
  function getVisibilityTag() {
    if (repository.private) {
      return <div className="visibility-tab private-tag">Private</div>;
    } else {
      return <div className="visibility-tag public-tag">Public</div>;
    }
  }

  return (
    <div className="repository-info">
      <p className="repository-name">{repository.name}</p>
      <section>{getVisibilityTag()}</section>
    </div>
  );
}

export default FeaturdProjectOption;
