import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "@/lib/security/api-error";

type Bucket={count:number;resetAt:number};
const buckets=new Map<string,Bucket>();
export function checkRateLimit(key:string,limit:number,windowMs:number,now=Date.now()){const current=buckets.get(key);if(!current||current.resetAt<=now){buckets.set(key,{count:1,resetAt:now+windowMs});return{allowed:true,remaining:Math.max(0,limit-1),retryAfterMs:0}}if(current.count>=limit)return{allowed:false,remaining:0,retryAfterMs:current.resetAt-now};current.count+=1;return{allowed:true,remaining:limit-current.count,retryAfterMs:0}}
export function resetRateLimitsForTests(){buckets.clear()}
function clientKey(request:Request,userId:string){const forwarded=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||request.headers.get("x-real-ip")||"unknown";return createHash("sha256").update(`${userId}:${forwarded}`).digest("hex").slice(0,32)}
export function guardApiRequest(request:Request,input:{userId:string;route:string;maxBytes:number;limit:number;windowMs?:number}){
  const requestId=request.headers.get("x-request-id")?.slice(0,120)||randomUUID();
  const origin=request.headers.get("origin");
  if(origin){
    const allowed=new Set([new URL(request.url).origin]);
    try{if(process.env.NEXT_PUBLIC_APP_URL)allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin)}catch{}
    if(!allowed.has(origin))throw new ApiError("ORIGIN_REJECTED","The request origin is not allowed.",403);
  }
  const length=Number(request.headers.get("content-length")||0);
  if(Number.isFinite(length)&&length>input.maxBytes)throw new ApiError("REQUEST_TOO_LARGE",`Request exceeds the ${Math.floor(input.maxBytes/1_000_000)} MB limit.`,413);
  const rate=checkRateLimit(`${input.route}:${clientKey(request,input.userId)}`,input.limit,input.windowMs||60_000);
  if(!rate.allowed)throw new ApiError("RATE_LIMITED",`Too many requests. Try again in ${Math.max(1,Math.ceil(rate.retryAfterMs/1000))} seconds.`,429);
  return{requestId,rate};
}
export function idempotencyKey(request:Request,fallback:string){const supplied=request.headers.get("x-idempotency-key")?.trim();if(supplied&&supplied.length>=8&&supplied.length<=160)return supplied;return fallback.slice(0,160)}
