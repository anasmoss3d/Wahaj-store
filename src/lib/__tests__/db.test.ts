import { describe, expect, it } from "vitest";
import { deriveSupabaseSessionPoolerUrl, normalizeDatabaseUrl } from "@/lib/db-url";

describe("normalizeDatabaseUrl", () => {
  it("returns undefined for empty inputs", () => {
    expect(normalizeDatabaseUrl(undefined)).toBeUndefined();
    expect(normalizeDatabaseUrl("   ")).toBeUndefined();
  });

  it("leaves localhost URLs unchanged", () => {
    const local = "postgresql://postgres:postgres@localhost:5432/wahaj_store?schema=public";
    expect(normalizeDatabaseUrl(local)).toBe(local);
  });

  it("adds pgbouncer, connection_limit, and connect_timeout to Supabase transaction pooler URLs", () => {
    const input =
      "postgresql://postgres.abcd:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
    const normalized = normalizeDatabaseUrl(input);
    const parsed = new URL(normalized!);
    expect(parsed.searchParams.get("pgbouncer")).toBe("true");
    expect(parsed.searchParams.get("connection_limit")).toBe("5");
    expect(parsed.searchParams.get("connect_timeout")).toBe("15");
  });

  it("preserves explicit pool parameters when already configured", () => {
    const input =
      "postgresql://user:pass@ep-cool-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=10&connect_timeout=30";
    const parsed = new URL(normalizeDatabaseUrl(input)!);
    expect(parsed.searchParams.get("sslmode")).toBe("require");
    expect(parsed.searchParams.get("pgbouncer")).toBe("true");
    expect(parsed.searchParams.get("connection_limit")).toBe("10");
    expect(parsed.searchParams.get("connect_timeout")).toBe("30");
  });

  it("adds connection bounds to remote non-pooler URLs without forcing pgbouncer=true", () => {
    const input = "postgresql://postgres:secret@db.example.com:5432/wahaj";
    const parsed = new URL(normalizeDatabaseUrl(input)!);
    expect(parsed.searchParams.has("pgbouncer")).toBe(false);
    expect(parsed.searchParams.get("connection_limit")).toBe("5");
    expect(parsed.searchParams.get("connect_timeout")).toBe("15");
  });
});

describe("deriveSupabaseSessionPoolerUrl", () => {
  it("switches Supabase pooler URLs from transaction port 6543 to IPv4 session port 5432", () => {
    const input =
      "postgresql://postgres.abcd:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5";
    const derived = deriveSupabaseSessionPoolerUrl(input);
    const parsed = new URL(derived!);
    expect(parsed.port).toBe("5432");
    expect(parsed.searchParams.has("pgbouncer")).toBe(false);
    expect(parsed.searchParams.has("connection_limit")).toBe(false);
  });

  it("returns undefined for non-Supabase URLs", () => {
    expect(
      deriveSupabaseSessionPoolerUrl("postgresql://postgres:postgres@localhost:5432/wahaj_store")
    ).toBeUndefined();
  });
});
