import { CONNECT_STATUS } from "./enums";
import { getUserDataID } from "./posts";

const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;

/***
 * Gets the status of a connection.
 * Returns an enum.
 */
export async function getConnectionStatus(userID, connectionID) {
  try {
    const response = await fetch(
      `${DATABASE}/connection/${userID}/${connectionID}`
    );

    const connection = await response.json();

    if (connection.length > 0) {
      if (connection[0].accepted) {
        return CONNECT_STATUS.CONNECTED;
      } else {
        if (connection[0].senderID === userID) {
          return CONNECT_STATUS.REQUESTED;
        } else {
          return CONNECT_STATUS.RESPOND;
        }
      }
    } else {
      return CONNECT_STATUS.NOT_CONNECTED;
    }
  } catch {}
}

/***
 * Gets all of a user's connections.
 */
export async function getConnections(userID) {
  try {
    const response = await fetch(`${DATABASE}/connections/${userID}`);
    const connections = await response.json();

    return connections;
  } catch {}
}

/***
 * Removes a connection between two users.
 */
export async function removeConnection(userID, connectionID) {
  try {
    await fetch(`${DATABASE}/connection/${userID}/${connectionID}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
  } catch {}
}

/***
 * Adds a request connection to the database.
 */
export async function requestConnection(userID, connectionID) {
  try {
    await fetch(`${DATABASE}/connection/${userID}/${connectionID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {}
}

/***
 * Updates the existing connection to be accepted.
 */
export async function addConnection(userID, connectionID) {
  try {
    await fetch(`${DATABASE}/connection/${userID}/${connectionID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
  } catch {}
}

/***
 * Gets the pending connection of a user given their ID.
 */
export async function getPendingConnections(userID) {
  try {
    const response = await fetch(`${DATABASE}/pending/${userID}`);
    const pendingConnections = await response.json();

    return pendingConnections;
  } catch {}
}

/***
 * Gets a data for the recommended users.
 */
export async function getRecommendedUsers(userID, numberOfRecs) {
  try {
    let recommendations = [];

    const recommendationIDsResponse = await fetch(
      `${DATABASE}/connections/recommendations/${userID}/${numberOfRecs}`
    );
    const recommendationIDs = await recommendationIDsResponse.json();

    for (const recommendationIDIndex in recommendationIDs) {
      const recommendationUserData = await getUserDataID(
        recommendationIDs[recommendationIDIndex]
      );
      recommendations = recommendations.concat(recommendationUserData);
    }

    return recommendations;
  } catch {}
}
