import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import {
  getAllDeployments,
  getGitHubRepositories,
} from "./util/featuredProjects";
import LoadingPage from "./LoadingPage";
import FeaturedPostOption from "../components/FeaturedPostOption";

function FeaturedPostCreationPage() {
  const [cookies] = useCookies(["user"]);
  const [isLoading, setIsLoading] = useState(true);
  const [githubRepositories, setGitHubRepositories] = useState([]);
  const [deployedGitHubRepos, setDeployedGitHubRepos] = useState({}); //Deployed repository with the key being the GitHub URL and value being an array of the deployed repositories.

  useEffect(() => {
    async function loadData() {
      const loadedGitHubRepositories = await getGitHubRepositories(
        cookies.user.githubHandle
      );
      setGitHubRepositories(loadedGitHubRepositories);

      for (const repositoryIndex in loadedGitHubRepositories) {
        const repositoryName = loadedGitHubRepositories[repositoryIndex].name;
        const loadedDeployments = await getAllDeployments(
          cookies.user.githubHandle,
          repositoryName
        );
        setDeployedGitHubRepos((previousDeployedGitHubRepos) => ({
          ...previousDeployedGitHubRepos,
          [repositoryName]: loadedDeployments,
        }));
      }
    }

    loadData();
    setIsLoading(false);
  }, [cookies]);

  if (isLoading) {
    return (
      <div>
        <LoadingPage />
      </div>
    );
  } else {
    return (
      <div>
        <h3>Choose a repository:</h3>
        {githubRepositories.map((repositoryData) => (
          <FeaturedPostOption
            repositoryData={{
              repositoryData: repositoryData,
              repositoryDeployments: deployedGitHubRepos[repositoryData.name],
            }}
          />
        ))}
      </div>
    );
  }
}

export default FeaturedPostCreationPage;
