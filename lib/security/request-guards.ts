import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "@/lib/security/api-error";

type Bucket={count:number;resetAt:number};
const buckets=new Map<string,Bucket>();
export function checkRateLimit(key:string,limit:number,windowMs:number,now=Date.now()){const current=buckets.get(key);if(!current||current.resetAt<=now){buckets.set(key,{count:1,resetAt:now+windowMs});return{allowed:true,remaining:Math.max(0,limit-1),retryAfterMs:0}}if(current.count>=limit)return{allowed:false,remaining:0,retryAfterMs:current.resetAt-now};current.count+=1;return{allowed:true,remaining:limit-current.count,retryAfterMs:0}}
export function resetRateLimitsForTests(){buckets.clear()}
function clientKey(request:Request,userId:string){const forwarded=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||request.headers.get("x-real-ip")||"unknown";return createHash("sha256").update(`${userId}:${forwarded}`).digest("hex").slice(0,32)}
function validateRequest(request:Request,input:{userId:string;route:string;maxBytes:number}){
  const requestId=request.headers.get("x-request-id")?.slice(0,120)||randomUUID();
  const origin=request.headers.get("origin");
  if(origin){
    const allowed=new Set([new URL(request.url).origin]);
    try{if(process.env.NEXT_PUBLIC_APP_URL)allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin)}catch{}
    if(!allowed.has(origin))throw new ApiError("ORIGIN_REJECTED","The request origin is not allowed.",403);
  }
  const length=Number(request.headers.get("content-length")||0);
  if(Number.isFinite(length)&&length>input.maxBytes)throw new ApiError("REQUEST_TOO_LARGE",`Request exceeds the ${Math.floor(input.maxBytes/1_000_000)} MB limit.`,413);
  return {requestId,key:`${input.route}:${clientKey(request,input.userId)}`};
}

export function guardApiRequest(request:Request,input:{userId:string;route:string;maxBytes:number;limit:number;windowMs?:number}){
  const validated=validateRequest(request,input);
  const rate=checkRateLimit(validated.key,input.limit,input.windowMs||60_000);
  if(!rate.allowed)throw new ApiError("RATE_LIMITED",`Too many requests. Try again in ${Math.max(1,Math.ceil(rate.retryAfterMs/1000))} seconds.`,429);
  return{requestId:validated.requestId,rate};
}

type DistributedRateLimitResult={allowed:boolean;remaining:number;retryAfterMs:number};

async function checkDistributedRateLimit(key:string,limit:number,windowMs:number):Promise<DistributedRateLimitResult|null>{
  const url=process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/,"");
  const token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url||!token)return null;
  const ttlSeconds=Math.max(1,Math.ceil(windowMs/1000));
  try{
    const response=await fetch(`${url}/pipeline`,{
      method:"POST",
      headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
      body:JSON.stringify([["INCR",key],["EXPIRE",key,ttlSeconds]]),
      cache:"no-store",
      signal:AbortSignal.timeout(1500),
    });
    if(!response.ok)throw new Error(`rate-limit-provider-${response.status}`);
    const result=await response.json() as Array<{result?:number}>;
    const count=Number(result?.[0]?.result);
    if(!Number.isFinite(count))throw new Error("invalid-rate-limit-result");
    return count>limit?{allowed:false,remaining:0,retryAfterMs:windowMs}:{allowed:true,remaining:Math.max(0,limit-count),retryAfterMs:0};
  }catch(error){
    if(process.env.DISTRIBUTED_RATE_LIMIT_REQUIRED==="1")throw new ApiError("RATE_LIMIT_UNAVAILABLE","Traffic protection is temporarily unavailable. Try again shortly.",503);
    console.warn("Distributed rate limiter unavailable; using instance-local protection.",error instanceof Error?error.message:"unknown");
    return null;
  }
}

export async function guardApiRequestAsync(request:Request,input:{userId:string;route:string;maxBytes:number;limit:number;windowMs?:number}){
  const validated=validateRequest(request,input);
  const windowMs=input.windowMs||60_000;
  const distributed=await checkDistributedRateLimit(validated.key,input.limit,windowMs);
  const rate=distributed||checkRateLimit(validated.key,input.limit,windowMs);
  if(!rate.allowed)throw new ApiError("RATE_LIMITED",`Too many requests. Try again in ${Math.max(1,Math.ceil(rate.retryAfterMs/1000))} seconds.`,429);
  return{requestId:validated.requestId,rate,distributed:Boolean(distributed)};
}
export function idempotencyKey(request:Request,fallback:string){const supplied=request.headers.get("x-idempotency-key")?.trim();if(supplied&&supplied.length>=8&&supplied.length<=160)return supplied;return fallback.slice(0,160)}
