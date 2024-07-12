/***
 * Retrieves all GitHub repositories for the specified user given a user handle.
 */
export async function getGitHubRepositories(githubHandle) {
  try {
    const response = await fetch(
      `https://api.github.com/users/${githubHandle}/repos`
    );
    const repositories = await response.json();
    return repositories;
  } catch {
    // Unable to retrieve repositories.
  }
}

/***
 * Gets all deployments for a specific repository.
 * Returns an array of deployment info, including the deployment IDs that can later be used to retrieve a specific deployment.
 */
export async function getAllDeployments(githubHandle, githubRepositoryName) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${githubHandle}/${githubRepositoryName}/deployments`
    );
    const deployments = await response.json();

    return deployments;
  } catch {
    // Unable to retrieve deployments.
  }
}
