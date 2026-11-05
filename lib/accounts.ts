import type { UserRole } from "./types";

export type Account = { password: string; role: UserRole };

const VALID_ROLES: UserRole[] = ["staff", "admin"];

/** Remove whitespace and any wrapping quotes, e.g. from a value pasted with quotes. */
function clean(s: string) {
  return s.trim().replace(/^["'`]+|["'`]+$/g, "").trim();
}

/**
 * Parse POS_ACCOUNTS: entries of `username:password:role`, separated by
 * commas, semicolons or newlines. Tolerates surrounding quotes, extra spaces
 * and a capitalised role. Passwords may not contain ":", "," or ";".
 */
export function parseAccounts(raw: string | undefined): Record<string, Account> {
  const accounts: Record<string, Account> = {};
  if (!raw) return accounts;

  for (const entry of clean(raw).split(/[,;\n\r]+/)) {
    const trimmed = clean(entry);
    if (!trimmed) continue;

    const parts = trimmed.split(":").map(clean);
    if (parts.length !== 3) {
      console.warn("POS_ACCOUNTS: skipping malformed entry (expected username:password:role)");
      continue;
    }

    const [username, password] = parts;
    const role = parts[2].toLowerCase() as UserRole;
    if (!username || !password || !VALID_ROLES.includes(role)) {
      console.warn(`POS_ACCOUNTS: skipping invalid entry for "${username}"`);
      continue;
    }

    accounts[username.toLowerCase()] = { password, role };
  }

  return accounts;
}
