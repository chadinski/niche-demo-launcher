import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { safeImageDataUrlSchema } from "@/lib/openai-business-intelligence";
import { deploymentAccess } from "@/lib/security/deployment-access";
import { checkRateLimit, guardApiRequest, idempotencyKey, resetRateLimitsForTests } from "@/lib/security/request-guards";
import { estimatedOperationCost, operationForGeneration } from "@/lib/usage/entitlements";
import { sanitizePreviewHtml } from "@/lib/generation/preview";
import { friendlyAuthError } from "@/lib/auth/errors";

afterEach(()=>{vi.unstubAllEnvs();resetRateLimitsForTests()});

describe("safe authentication redirects",()=>{
  it("accepts internal paths and rejects protocol-relative or backslash redirects",()=>{
    expect(safeRedirectPath("/create?firstProject=1")).toBe("/create?firstProject=1");
    expect(safeRedirectPath("//evil.example/steal")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("https://evil.example")).toBe("/dashboard");
  });
  it("maps provider errors to customer-safe authentication guidance",()=>{
    expect(friendlyAuthError("Invalid login credentials")).toBe("Email or password is incorrect.");
    expect(friendlyAuthError("Email not confirmed")).toMatch(/verify/i);
  });
});

describe("request and abuse controls",()=>{
  it("enforces the configured sliding request window",()=>{
    expect(checkRateLimit("user:route",2,60_000,100).allowed).toBe(true);
    expect(checkRateLimit("user:route",2,60_000,101).allowed).toBe(true);
    expect(checkRateLimit("user:route",2,60_000,102).allowed).toBe(false);
    expect(checkRateLimit("user:route",2,60_000,60_101).allowed).toBe(true);
  });
  it("rejects declared oversized requests before body parsing",()=>{
    const request=new Request("https://example.test/api",{method:"POST",headers:{"content-length":"1001"}});
    expect(()=>guardApiRequest(request,{userId:"user-a",route:"test",maxBytes:1000,limit:2})).toThrow(/exceeds/i);
  });
  it("rejects cross-origin mutation requests",()=>{
    const request=new Request("https://app.example.test/api",{method:"POST",headers:{origin:"https://evil.example"}});
    expect(()=>guardApiRequest(request,{userId:"user-a",route:"test",maxBytes:1000,limit:2})).toThrow(/origin/i);
  });
  it("uses a valid client idempotency key and ignores unsafe values",()=>{
    expect(idempotencyKey(new Request("https://example.test",{headers:{"x-idempotency-key":"stable-key-123"}}),"fallback-key")).toBe("stable-key-123");
    expect(idempotencyKey(new Request("https://example.test",{headers:{"x-idempotency-key":"x"}}),"fallback-key")).toBe("fallback-key");
  });
});

describe("upload validation",()=>{
  it("accepts supported base64 images and rejects SVG or arbitrary data",()=>{
    expect(safeImageDataUrlSchema.safeParse("data:image/png;base64,aGVsbG8=").success).toBe(true);
    expect(safeImageDataUrlSchema.safeParse("data:image/svg+xml;base64,PHN2Zz4=").success).toBe(false);
    expect(safeImageDataUrlSchema.safeParse("https://internal.example/image.png").success).toBe(false);
  });
});

describe("entitlements and deployment",()=>{
  it("maps generation quality to provider-neutral usage operations",()=>{
    expect(operationForGeneration("fast-draft")).toBe("fast_generation");
    expect(operationForGeneration("premium-final")).toBe("premium_generation");
    expect(estimatedOperationCost("premium_generation")).toBeGreaterThan(0);
  });
  it("keeps managed deployment disabled unless both flag and account approval exist",()=>{
    const user={mode:"remote" as const,userId:"user-a",email:"owner@example.com"};
    expect(deploymentAccess(user).allowed).toBe(false);
    vi.stubEnv("AUTOMATED_DEPLOYMENT_ENABLED","1");
    vi.stubEnv("DEPLOYMENT_APPROVED_EMAILS","owner@example.com");
    expect(deploymentAccess(user).allowed).toBe(true);
    expect(deploymentAccess({...user,email:"other@example.com"}).allowed).toBe(false);
  });
});

describe("tenant and preview hardening contracts",()=>{
  it("ships cross-tenant child-table RLS checks in the versioned migration",()=>{
    const sql=readFileSync(resolve(process.cwd(),"supabase/migrations/202607110001_public_beta_foundation.sql"),"utf8");
    expect(sql).toMatch(/generated websites[\s\S]*exists\(select 1 from public\.prospects/i);
    expect(sql).toMatch(/outreach messages[\s\S]*exists\(select 1 from public\.prospects/i);
    expect(sql).toMatch(/lead candidates[\s\S]*exists\(select 1 from public\.lead_search_runs/i);
    expect(sql).toMatch(/security definer[\s\S]*auth\.uid\(\)/i);
    expect(sql).toMatch(/prevent_profile_role_escalation[\s\S]*service_role/i);
  });
  it("renders untrusted generated HTML in scriptless sandboxed iframes",()=>{
    const workspace=readFileSync(resolve(process.cwd(),"components/demo-workspace.tsx"),"utf8");
    const detail=readFileSync(resolve(process.cwd(),"components/prospect-detail.tsx"),"utf8");
    for(const source of [workspace,detail]){expect(source).toContain('sandbox=""');expect(source).toContain('referrerPolicy="no-referrer"');}
  });
  it("removes active content before placing generated HTML in srcDoc",()=>{
    const html=sanitizePreviewHtml('<script>alert(1)</script><img src="x" onerror="steal()"><a href="javascript:steal()">Open</a><meta http-equiv="refresh" content="0;url=https://evil.test">');
    expect(html).not.toMatch(/script|onerror|http-equiv/i);
    expect(html).not.toContain("javascript:");
  });
});
