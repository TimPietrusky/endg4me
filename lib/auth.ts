import { withAuth } from "@workos-inc/authkit-nextjs";

export async function getAuthUser() {
  const { user } = await withAuth();
  return user;
}

export async function requireAuth() {
  const { user } = await withAuth({ ensureSignedIn: true });
  return user;
}

