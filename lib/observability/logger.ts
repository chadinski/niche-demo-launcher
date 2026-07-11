type LogLevel="info"|"warn"|"error";
const REDACTED_KEYS=/email|phone|name|address|content|html|prompt|image|token|secret|key/i;
function safeMetadata(value:Record<string,unknown>={}){return Object.fromEntries(Object.entries(value).filter(([key])=>!REDACTED_KEYS.test(key)).map(([key,item])=>[key,typeof item==="string"?item.slice(0,240):item]))}
export function serverLog(level:LogLevel,event:string,metadata:Record<string,unknown>={}){const payload={timestamp:new Date().toISOString(),level,event,...safeMetadata(metadata)};if(level==="error")console.error(JSON.stringify(payload));else if(level==="warn")console.warn(JSON.stringify(payload));else console.info(JSON.stringify(payload))}
