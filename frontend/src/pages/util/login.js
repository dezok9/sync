import { DATABASE } from "./data";

/***
 * Attempts to login.
 * Will inform the user if the provided credentials are incorrect.
 */
export async function login(user, password) {
    const res = await fetch(`${DATABASE}/login`, {
        "method": "POST",
            headers: {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                user: user,
                password: password
            })
        }
    );

}
