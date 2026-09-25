const SAFE_METHODS=new Set(["GET","HEAD","OPTIONS"]);
const API_MUTATION_METHODS=new Set(["POST","PUT","PATCH","DELETE"]);

function securityHeaders(req,res,next){
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Content-Security-Policy","frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
  res.setHeader("Permissions-Policy","camera=(), microphone=(), geolocation=()");
  if(process.env.NODE_ENV==="production"){
    res.setHeader("Strict-Transport-Security","max-age=31536000; includeSubDomains");
    if(req.path.startsWith("/api/"))res.setHeader("Cache-Control","no-store");
  }
  next();
}

function createRateLimiter({windowMs=60_000,max=120,keyFn}={}){
  const buckets=new Map();
  const cleanup=setInterval(()=>{const cutoff=Date.now()-windowMs;for(const [key,b] of buckets)if(b.resetAt<cutoff)buckets.delete(key)},Math.min(windowMs,60_000));
  if(cleanup.unref)cleanup.unref();
  return (req,res,next)=>{
    const key=String((keyFn&&keyFn(req))||req.ip||req.socket?.remoteAddress||"unknown");
    const now=Date.now();
    let b=buckets.get(key);
    if(!b||b.resetAt<=now)b={count:0,resetAt:now+windowMs};
    b.count+=1;buckets.set(key,b);
    res.setHeader("X-RateLimit-Limit",String(max));
    res.setHeader("X-RateLimit-Remaining",String(Math.max(0,max-b.count)));
    if(b.count>max){res.setHeader("Retry-After",String(Math.ceil((b.resetAt-now)/1000)));return res.status(429).json({ok:false,error:"Too many requests"});}
    next();
  };
}

function validCoordinatePair(latitude,longitude){
  if(latitude==null&&longitude==null)return true;
  const lat=Number(latitude),lng=Number(longitude);
  return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180;
}
function cleanString(value,max=500){
  if(value==null)return null;
  const s=String(value).trim();
  return s.length&&s.length<=max?s:null;
}
function validPhone(value){
  const s=String(value||"").trim();
  return /^\+?[0-9\s().-]{7,25}$/.test(s);
}
function validateOrderInput(body){
  const b=body||{};
  if(!cleanString(b.clientName,120)||!validPhone(b.phone)||!cleanString(b.serviceCategory,120)||!cleanString(b.location,500))return "Invalid order fields";
  if(!validCoordinatePair(b.latitude,b.longitude))return "Invalid coordinates";
  if(b.priority!=null&&!["normal","high","critical"].includes(b.priority))return "Invalid priority";
  return null;
}

function sameOriginGuard(req,res,next){
  if(process.env.NODE_ENV!=="production"||SAFE_METHODS.has(req.method)||!API_MUTATION_METHODS.has(req.method)||(req.path.startsWith("/api/payments/")&&req.path.endsWith("/webhook")))return next();
  const fetchSite=req.get("sec-fetch-site");
  if(fetchSite==="cross-site")return res.status(403).json({ok:false,error:"Cross-site request blocked"});
  const origin=req.get("origin");
  if(origin)return allowedOrigin(origin,res,next);
  const referer=req.get("referer");
  if(referer){
    try{return allowedOrigin(new URL(referer).origin,res,next)}catch{}
  }
  return res.status(403).json({ok:false,error:"Origin verification required"});
}
function allowedOrigin(origin,res,next){
  const allowed=["https://oxygen11.com","https://www.oxygen11.com","https://admin.oxygen11.com","https://owner.oxygen11.com","https://client.oxygen11.com","https://technician.oxygen11.com"].includes(origin);
  if(!allowed)return res.status(403).json({ok:false,error:"Origin not allowed"});
  next();
}
module.exports={SAFE_METHODS,securityHeaders,createRateLimiter,validCoordinatePair,cleanString,validPhone,validateOrderInput,sameOriginGuard};
