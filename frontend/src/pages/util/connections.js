import { CONNECT_STATUS } from "./enums";

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
          CONNECT_STATUS.REQUESTED;
        } else {
          CONNECT_STATUS.RESPOND;
        }
      }
    } else {
      return CONNECT_STATUS.NOT_CONNECTED;
    }
  } catch {}
}

/***
 * Removes a connection between two users.
 */
export async function removeConnection(userID, connectionID) {
  try {
    await fetch(`${DATABASE}/connection/${userID}/${connection}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
  } catch {}
}
