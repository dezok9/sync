const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;

/***
 * Retrieves all GitHub repositories for the specified user given a user handle.
 */
export async function getGitHubRepositories(githubHandle) {
  try {
    const response = await fetch(`${DATABASE}/get-repos/${githubHandle}`);

    const repositories = response.json();

    return repositories;
  } catch {
    // Unable to retrieve repositories.
  }
}

/***
 * Gets all deployments for a specific repository.
 * Returns an array of deployment info, including the deployment IDs that can later be used to retrieve a specific deployment.
 */
export async function getAllDeployments(githubHandle, repositoryName) {
  try {
    const response = await fetch(
      `${DATABASE}/all-deployments/${githubHandle}/${repositoryName}`
    );

    const deployments = response.json();

    return deployments;
  } catch {
    // Unable to retrieve deployments.
  }
}
