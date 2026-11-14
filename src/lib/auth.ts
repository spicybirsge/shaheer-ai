import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { database } from "./db";
import * as schema from "./db/schema";
import { inArray } from "drizzle-orm";
function createAuth() {
  return betterAuth({
    database: drizzleAdapter(database(), { provider: "pg", schema }),
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    user: {
      deleteUser: {
        enabled: true,
        beforeDelete: async (user, request) => {
          if (!request)
            throw new Error("Deletion requires an authenticated request");
          const response = await fetch(
            `${process.env.BETTER_AUTH_URL}/eve/v1/account/purge`,
            {
              method: "POST",
              redirect: "error",
              headers: {
                cookie: request.headers.get("cookie") ?? "",
                origin: new URL(process.env.BETTER_AUTH_URL!).origin,
              },
            },
          );
          if (!response.ok)
            throw new Error(
              "Could not stop your agent sessions. Please retry deletion.",
            );
          await database()
            .delete(schema.verification)
            .where(
              inArray(schema.verification.identifier, [user.id, user.email]),
            );
        },
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60 },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
