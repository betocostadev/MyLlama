import { SQL } from "bun";

const databaseUrl =
  process.env.DATABASE_URL

let sqlInstance: SQL | null = null;

export function getSql(): SQL {
  if (!sqlInstance) {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sqlInstance = new SQL(databaseUrl);
  }
  return sqlInstance;
}

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const sql = getSql();
    // Quick probe query with a short timeout
    const result = await Promise.race([
      sql`SELECT 1 as result`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timeout (2s)")), 2000)
      ),
    ]);

    if (result && result.length > 0) {
      return { connected: true, message: "PostgreSQL connected successfully" };
    }
    return { connected: false, message: "Unexpected response from PostgreSQL" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { connected: false, message };
  }
}
