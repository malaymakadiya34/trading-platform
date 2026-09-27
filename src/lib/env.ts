const requiredServerEnvironment = ["DATABASE_URL"] as const;

export function getServerEnvironment() {
  const missing = requiredServerEnvironment.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required server environment variables: ${missing.join(", ")}`);
  }

  return {
    databaseUrl: process.env.DATABASE_URL as string,
  };
}
