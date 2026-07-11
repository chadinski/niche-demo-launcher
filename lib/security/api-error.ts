export class ApiError extends Error {
  constructor(public code:string,message:string,public status=400){super(message);this.name="ApiError"}
}
export function userSafeError(error:unknown,fallback="The request could not be completed."){if(error instanceof ApiError)return{status:error.status,body:{error:error.message,code:error.code}};return{status:503,body:{error:fallback,code:"SERVICE_UNAVAILABLE"}}}
