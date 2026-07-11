"use server";

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { z } from "zod";
import { requireServerUser, ServerAuthError } from "@/lib/auth/server-guard";
import { deploymentAccess } from "@/lib/security/deployment-access";
import { completeUsage, reserveUsage, type UsageReservation } from "@/lib/usage/entitlements";
import { checkRateLimit } from "@/lib/security/request-guards";
import { slugify } from "@/lib/utils";
import type { DeploymentResult } from "@/lib/types";

type DeployInput = {
  businessName: string;
  html: string;
};
const deploySchema=z.object({businessName:z.string().trim().min(1).max(180),html:z.string().min(100).max(2_500_000)});

const GITHUB_OWNER_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

function requiredEnv() {
  const missing: string[] = [];
  if (!process.env.VERCEL_TOKEN) missing.push("VERCEL_TOKEN");
  return missing;
}

function githubMissingEnv() {
  const missing: string[] = [];
  if (!process.env.GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
  if (!process.env.GITHUB_OWNER) missing.push("GITHUB_OWNER");
  if (process.env.GITHUB_OWNER && !GITHUB_OWNER_PATTERN.test(process.env.GITHUB_OWNER)) {
    missing.push("GITHUB_OWNER_VALID_NAME");
  }
  return missing;
}

function githubOwner() {
  const owner = process.env.GITHUB_OWNER;
  if (!owner || !GITHUB_OWNER_PATTERN.test(owner)) {
    throw new Error("GitHub owner is missing or invalid.");
  }
  return owner;
}

export async function getAutomationStatus() {
  const user=await requireServerUser();
  const access=deploymentAccess(user);
  return {
    generationReady:Boolean(process.env.GEMINI_API_KEY||process.env.OPENAI_API_KEY),
    managedDeploymentAvailable:access.allowed&&requiredEnv().length===0,
    managedDeploymentReason:access.allowed?requiredEnv().length?"Managed deployment is temporarily unavailable.":"Approved beta access":access.reason,
  };
}

async function githubRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    signal:AbortSignal.timeout(30_000),
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.message === "string" ? body.message : "GitHub request failed");
  }
  return body;
}

async function ensureRepo(repo: string) {
  const owner = githubOwner();
  try {
    await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/not found/i.test(message)) throw error;
    await githubRequest("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: repo,
        private: true,
        auto_init: true,
        description: "Generated Seraphim website deployment.",
      }),
    });
  }
}

async function upsertIndexHtml(repo: string, html: string) {
  const owner = githubOwner();
  let sha: string | undefined;

  try {
    const existing = await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/index.html`,
    );
    sha = existing?.sha;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/not found/i.test(message)) throw error;
  }

  await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/index.html`, {
    method: "PUT",
    body: JSON.stringify({
      message: "Publish generated website",
      content: Buffer.from(html, "utf8").toString("base64"),
      sha,
    }),
  });
}

async function deployToVercel(name: string, html: string) {
  const url = new URL("https://api.vercel.com/v13/deployments");
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      target: "production",
      files: [{ file: "index.html", data: html }],
      projectSettings: { framework: null },
    }),
    signal:AbortSignal.timeout(45_000),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.error?.message === "string" ? body.error.message : "Vercel deployment failed");
  }

  const deploymentUrl = typeof body.url === "string" ? body.url : "";
  if (!/^[a-z0-9.-]+$/i.test(deploymentUrl)) {
    throw new Error("Vercel returned an invalid deployment URL.");
  }

  return `https://${deploymentUrl}`;
}

export async function deployGeneratedWebsite(input: DeployInput): Promise<DeploymentResult> {
  let user;
  let reservation:UsageReservation|undefined;
  try {
    user=await requireServerUser();
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      message: error instanceof ServerAuthError ? error.message : "Authentication required before deployment.",
    };
  }

  const access=deploymentAccess(user);
  if(!access.allowed)return{ok:false,status:"setup_required",message:access.reason};
  if(!checkRateLimit(`managed-deployment:${user.userId}`,3,60_000).allowed)return{ok:false,status:"failed",message:"Too many deployment requests. Wait a minute and try again."};
  const parsed=deploySchema.safeParse(input);
  if(!parsed.success)return{ok:false,status:"failed",message:"Review the project name and generated HTML before deployment."};

  const missing = requiredEnv();
  if (missing.length) {
    return {
      ok: false,
      status: "setup_required",
      message: "Deployment automation is not configured yet. Manual download is still available.",
      missing,
    };
  }

  const slug = slugify(parsed.data.businessName || "seraphim-site") || "seraphim-site";
  const tenantSuffix=createHash("sha256").update(user.userId).digest("hex").slice(0,10);
  const repo = `${process.env.GITHUB_REPO_PREFIX || "niche-demo"}-${tenantSuffix}-${slug}`.slice(0,80);

  try {
    reservation=await reserveUsage(user,"deployment",createHash("sha256").update(`${repo}:${parsed.data.html}`).digest("hex"),`deploy-${tenantSuffix}`);
    let repoUrl = "";
    if (githubMissingEnv().length === 0) {
      await ensureRepo(repo);
      await upsertIndexHtml(repo, parsed.data.html);
      repoUrl = `https://github.com/${githubOwner()}/${repo}`;
    }

    const url = await deployToVercel(repo, parsed.data.html);
    await completeUsage(reservation,"succeeded",{provider:"vercel"});

    return {
      ok: true,
      status: "deployed",
      message: "Website deployed successfully.",
      url,
      repoUrl,
    };
  } catch {
    if(reservation)await completeUsage(reservation,"failed",{errorCode:"DEPLOYMENT_FAILED"});
    return {
      ok: false,
      status: "failed",
      message: "Managed deployment failed. Your generated HTML is still available to download.",
    };
  }
}
