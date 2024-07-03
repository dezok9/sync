const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;

export async function makePost() {
  try {
    const response = await fetch();
  } catch {}
}

export async function getFeed() {
  // Get posts from connections from database.
}

export async function getUserData(user) {
  const response = await fetch(`${DATABASE}/user/${user}`);
  const userData = await response.json();
  console.log(userData);
  return userData;
}
