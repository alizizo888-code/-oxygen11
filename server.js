const express=require("express");
const http=require("http");
const path=require("path");
const fs=require("fs");
const crypto=require("crypto");
const cookieParser=require("cookie-parser");
const {Server}=require("socket.io");
const admin=require("firebase-admin");
const db=require("./database/db");
const {getPaymentProvider}=require("./backend/payment_gateway/payment_processor");

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:(origin,callback)=>{if(!origin||allowedOrigins.has(origin))return callback(null,true);callback(new Error("Origin not allowed"))},credentials:true}});
const PORT=Number(process.env.PORT||3000);
const PUBLIC_DIR=path.join(__dirname,"public");
const DATA_DIR=path.join(__dirname,"data");
const ORDERS_FILE=path.join(DATA_DIR,"orders.json");
const SESSIONS_FILE=path.join(DATA_DIR,"sessions.json");
const allowedOrigins=new Set(["https://oxygen11.com","https://www.oxygen11.com","https://admin.oxygen11.com","https://owner.oxygen11.com","https://client.oxygen11.com","https://technician.oxygen11.com"]);
const hostPages={"oxygen11.com":"index.html","www.oxygen11.com":"index.html","admin.oxygen11.com":"admin.html","owner.oxygen11.com":"owner.html","client.oxygen11.com":"client.html","technician.oxygen11.com":"technician.html"};
const STATUS_FLOW=["pending_dispatch","assigned_automatic","assigned_manual","in_progress","awaiting_payment","completed","cancelled"];
const transitions={pending_dispatch:["assigned_automatic","assigned_manual","cancelled"],assigned_automatic:["in_progress","cancelled"],assigned_manual:["in_progress","cancelled"],in_progress:["awaiting_payment","cancelled"],awaiting_payment:["completed","cancelled"],completed:[],cancelled:[]};
let dbEnabled=false,orders=[],sessions={},providers=[];

function now(){return new Date().toISOString()}
function csvSet(v){return String(v||"").split(",").map(x=>x.trim()).filter(Boolean)}
function configuredRole(uid){if(csvSet(process.env.OWNER_UIDS).includes(uid))return"owner";if(csvSet(process.env.ADMIN_UIDS).includes(uid))return"admin";if(csvSet(process.env.TECH_UIDS).includes(uid))return"tech";return"client"}
function readJson(file,fallback){try{return JSON.parse(fs.readFileSync(file,"utf8"))}catch{return fallback}}
function writeJson(file,value){fs.mkdirSync(DATA_DIR,{recursive:true});const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify(value,null,2),"utf8");fs.renameSync(tmp,file)}
async function persistOrder(o){if(dbEnabled)await db.saveOrder(o);else writeJson(ORDERS_FILE,orders)}
async function persistAudit(o,action,actor){if(dbEnabled)await db.addAudit(o.orderId,action,actor,Date.now());}
async function audit(o,action,actor){o.audit=o.audit||[];o.audit.push({action,actor,at:now()});await persistAudit(o,action,actor)}
async function seedRegistry(){if(!dbEnabled)return;const existing=await db.listUnits();if(existing.length)return;const base=[["page","home","الرئيسية"],["page","admin","لوحة الإدارة"],["page","owner","لوحة المالك"],["page","client","بوابة العميل"],["page","technician","بوابة الفني"],["workflow","maintenance-order","طلب صيانة"],["feature","automatic-dispatch","التوزيع التلقائي"],["feature","payments","الدفع الإلكتروني"],["feature","audit","سجل التدقيق"]];for(const [unitType,unitKey,displayName] of base){const at=now();try{await db.createUnit({unitId:"unit-"+unitKey,unitType,unitKey,displayName,status:"active",version:1,ownerUid:null,permissions:{roles:["owner","admin"]},conditions:{},design:{},linking:{},timing:{},scriptRef:null,texts:{ar:displayName},data:{},notifications:{},createdAt:at,updatedAt:at})}catch(e){console.warn("[Oxygen11] Registry seed skipped:",unitKey,e.message)}}}
async function initPersistence(){
  dbEnabled=await db.initDb();
  if(dbEnabled){
    orders=await db.listOrders();
    providers=await db.listProviders();
    const stored=await db.listSessions();
    sessions={};
    for(const s of stored) sessions[s.tokenHash]={uid:s.uid,role:s.role,createdAt:s.createdAt,expiresAt:s.expiresAt};
    await seedRegistry();
    console.log("[Oxygen11] MySQL persistence enabled");
  }else{
    if(process.env.NODE_ENV==="production"&&!String(process.env.ALLOW_JSON_FALLBACK||"").toLowerCase().includes("true"))throw new Error("Production database is not configured");
    orders=readJson(ORDERS_FILE,[]);
    sessions=readJson(SESSIONS_FILE,{});
    console.warn("[Oxygen11] MySQL not configured; using local JSON fallback");
  }
}
function sessionTokenHash(token){return crypto.createHash("sha256").update(token).digest("hex")}
async function createSession(uid,role){
  const token=crypto.randomBytes(32).toString("hex"),createdAt=Date.now(),expiresAt=createdAt+12*60*60*1000;
  const key=dbEnabled?sessionTokenHash(token):token;
  sessions[key]={uid,role,createdAt,expiresAt};
  if(dbEnabled)await db.createSession(token,uid,role,createdAt,expiresAt);
  else writeJson(SESSIONS_FILE,sessions);
  return token
}
async function sessionFromRequest(req){
  const token=req.cookies?.oxygen_session||req.get("x-oxygen-session");
  if(!token)return null;
  if(dbEnabled){
    const s=await db.getSession(token);
    if(!s)return null;
    return {uid:s.uid,role:s.role};
  }
  const s=sessions[token];
  if(!s)return null;
  if(Date.now()>Number(s.expiresAt)){delete sessions[token];writeJson(SESSIONS_FILE,sessions);return null}
  return {uid:s.uid,role:s.role}
}
async function removeSession(token){if(!token)return;if(dbEnabled){await db.deleteSession(token);delete sessions[sessionTokenHash(token)];}else{delete sessions[token];writeJson(SESSIONS_FILE,sessions)}}
function parseCoords(location){const m=String(location||"").match(/(-?\\d+(?:\\.\\d+)?)[,\\s]+(-?\\d+(?:\\.\\d+)?)/);return m?{lat:Number(m[1]),lng:Number(m[2])}:null}
function serviceMatches(p,category){const c=String(category||"").toLowerCase();return !p.serviceTypes.length||p.serviceTypes.some(x=>c.includes(String(x).toLowerCase())||String(x).toLowerCase().includes(c))}
function distance(a,b){if(!a||b.latitude===null||b.longitude===null)return Number.POSITIVE_INFINITY;const R=6371,rad=Math.PI/180,dLat=(b.latitude-a.lat)*rad,dLon=(b.longitude-a.lng)*rad;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.latitude*rad)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
async function dispatchAutomatically(o){if(!dbEnabled)return false;providers=await db.listProviders();const coords=parseCoords(o.location);const candidates=providers.filter(p=>serviceMatches(p,o.serviceCategory));if(!candidates.length)return false;candidates.sort((a,b)=>{const da=distance(coords,a),dbb=distance(coords,b);if(da!==dbb)return da-dbb;return String(a.lastAssignedAt||"").localeCompare(String(b.lastAssignedAt||""))});const chosen=candidates[0];o.providerUid=chosen.uid;o.providerName=chosen.fullName;o.dispatchType="automatic";o.status="assigned_automatic";o.updatedAt=now();await db.markProviderAssigned(chosen.uid,o.updatedAt);return true}
async function requireAuth(req,res,next){
  try{const s=await sessionFromRequest(req);if(!s)return res.status(401).json({ok:false,error:"Authentication required"});req.user=s;next()}
  catch(e){console.error("[Oxygen11] Session lookup error:",e);res.status(500).json({ok:false,error:"Authentication service unavailable"})}
}
function requireRole(...roles){return(req,res,next)=>{if(!req.user||!roles.includes(req.user.role))return res.status(403).json({ok:false,error:"Forbidden"});next()}}
function canTransition(a,b){return(transitions[a]||[]).includes(b)}
function emitOrder(o){io.emit("order_updated",o)}
async function verifyFirebaseToken(token){if(!admin.apps.length)throw new Error("Firebase Admin is not configured on the server");return admin.auth().verifyIdToken(token)}
function initFirebase(){if(admin.apps.length)return true;try{if(process.env.FIREBASE_SERVICE_ACCOUNT_JSON){admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))});return true}if(process.env.GOOGLE_APPLICATION_CREDENTIALS){admin.initializeApp({credential:admin.credential.applicationDefault()});return true}}catch(e){console.error("[Oxygen11] Firebase Admin init failed:",e.message)}return false}
initFirebase();

app.disable("x-powered-by");
app.use((req,res,next)=>{if(process.env.NODE_ENV!=="production")return next();const origin=req.get("origin");if(origin&&!allowedOrigins.has(origin))return res.status(403).json({ok:false,error:"Origin not allowed"});next()});
app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true,limit:"2mb"}));
app.use(cookieParser());

app.get("/health",(_req,res)=>res.json({ok:true,service:"oxygen11",environment:process.env.NODE_ENV||"development",firebaseAdmin:admin.apps.length>0,persistence:dbEnabled?"mysql":"json-fallback",orders:orders.length,timestamp:now()}));
app.get("/api/auth/config",(_req,res)=>res.json({ok:true,firebaseServerVerification:admin.apps.length>0,persistence:dbEnabled?"mysql":"json-fallback"}));

app.post("/api/auth/session",async(req,res)=>{
  try{
    const token=String(req.body?.idToken||"");if(!token)return res.status(400).json({ok:false,error:"idToken is required"});
    const decoded=await verifyFirebaseToken(token),role=configuredRole(decoded.uid),sessionToken=await createSession(decoded.uid,role);
    res.cookie("oxygen_session",sessionToken,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",domain:process.env.NODE_ENV==="production"?".oxygen11.com":undefined,maxAge:12*60*60*1000});
    res.json({ok:true,role,uid:decoded.uid})
  }catch(e){res.status(401).json({ok:false,error:e.message})}
});
app.post("/api/auth/logout",async(req,res)=>{await removeSession(req.cookies?.oxygen_session);res.clearCookie("oxygen_session");res.json({ok:true})});
app.get("/api/auth/me",requireAuth,(req,res)=>res.json({ok:true,user:req.user}));

app.post("/api/providers",requireAuth,requireRole("admin","owner"),async(req,res)=>{
  const p=req.body||{};if(!p.uid||!p.fullName)return res.status(400).json({ok:false,error:"uid and fullName are required"});
  if(!dbEnabled)return res.status(409).json({ok:false,error:"Provider management requires MySQL"});
  await db.upsertProvider({uid:String(p.uid),fullName:String(p.fullName),phone:p.phone?String(p.phone):null,serviceTypes:Array.isArray(p.serviceTypes)?p.serviceTypes.map(String):[],status:p.status==="suspended"?"suspended":"active",available:p.available!==false,latitude:p.latitude==null?null:Number(p.latitude),longitude:p.longitude==null?null:Number(p.longitude)});
  providers=await db.listProviders();res.status(201).json({ok:true,providers});
});
app.get("/api/providers",requireAuth,requireRole("admin","owner"),async(_req,res)=>res.json({ok:true,providers:dbEnabled?await db.listProviders():[]}));
app.patch("/api/providers/:uid/availability",requireAuth,requireRole("tech","admin","owner"),async(req,res)=>{
  if(!dbEnabled)return res.status(409).json({ok:false,error:"Provider management requires MySQL"});
  const uid=String(req.params.uid);if(req.user.role==="tech"&&req.user.uid!==uid)return res.status(403).json({ok:false,error:"Forbidden"});
  const list=await db.listProviders(),p=list.find(x=>x.uid===uid);if(!p)return res.status(404).json({ok:false,error:"Provider not found"});
  await db.upsertProvider({...p,available:req.body?.available!==false});providers=await db.listProviders();res.json({ok:true,provider:providers.find(x=>x.uid===uid)});
});

app.get("/api/registry/units",requireAuth,requireRole("admin","owner"),async(req,res)=>{if(!dbEnabled)return res.status(409).json({ok:false,error:"Registry requires MySQL"});res.json({ok:true,units:await db.listUnits({type:req.query.type,status:req.query.status})})});
app.post("/api/registry/units",requireAuth,requireRole("admin","owner"),async(req,res)=>{try{if(!dbEnabled)return res.status(409).json({ok:false,error:"Registry requires MySQL"});const b=req.body||{},nowAt=now();if(!b.unitId||!b.unitType||!b.unitKey||!b.displayName)return res.status(400).json({ok:false,error:"unitId, unitType, unitKey and displayName are required"});const unit=await db.createUnit({...b,unitId:String(b.unitId),unitType:String(b.unitType),unitKey:String(b.unitKey),displayName:String(b.displayName),ownerUid:b.ownerUid||req.user.uid,createdAt:nowAt,updatedAt:nowAt});await db.addAudit(1000,"registry_unit_created:"+unit.unitId,req.user.uid,Date.now()).catch(()=>{});res.status(201).json({ok:true,unit})}catch(e){res.status(409).json({ok:false,error:e.message})}});
app.get("/api/registry/units/:id",requireAuth,requireRole("admin","owner"),async(req,res)=>{if(!dbEnabled)return res.status(409).json({ok:false,error:"Registry requires MySQL"});const unit=await db.getUnit(String(req.params.id));if(!unit)return res.status(404).json({ok:false,error:"Unit not found"});res.json({ok:true,unit,versions:await db.listUnitVersions(unit.unitId)})});
app.patch("/api/registry/units/:id",requireAuth,requireRole("admin","owner"),async(req,res)=>{try{if(!dbEnabled)return res.status(409).json({ok:false,error:"Registry requires MySQL"});const allowed=["unitType","unitKey","displayName","status","ownerUid","permissions","conditions","design","linking","timing","scriptRef","texts","data","notifications"];const patch={};for(const k of allowed)if(req.body&&Object.prototype.hasOwnProperty.call(req.body,k))patch[k]=req.body[k];const unit=await db.updateUnit(String(req.params.id),patch,req.user.uid,String(req.body?.changeSummary||"registry_update"));res.json({ok:true,unit})}catch(e){res.status(400).json({ok:false,error:e.message})}});
app.get("/api/registry/units/:id/versions",requireAuth,requireRole("admin","owner"),async(req,res)=>{if(!dbEnabled)return res.status(409).json({ok:false,error:"Registry requires MySQL"});res.json({ok:true,versions:await db.listUnitVersions(String(req.params.id))})});

app.get("/api/orders",requireAuth,(req,res)=>{
  let visible=orders;if(req.user.role==="client")visible=orders.filter(o=>o.clientUid===req.user.uid);if(req.user.role==="tech")visible=orders.filter(o=>!o.providerUid||o.providerUid===req.user.uid);
  res.json({ok:true,orders:visible})
});

app.post("/api/orders",requireAuth,requireRole("client","admin","owner"),async(req,res)=>{
  const {clientName,phone,serviceCategory,priority,location,notes}=req.body||{};
  if(!clientName||!phone||!serviceCategory||!location)return res.status(400).json({ok:false,error:"clientName, phone, serviceCategory and location are required"});
  const order={orderId:dbEnabled?await db.nextOrderId():(orders.reduce((m,o)=>Math.max(m,Number(o.orderId)||1000),1000)+1),clientUid:req.user.uid,clientName:String(clientName).trim(),phone:String(phone).trim(),serviceCategory:String(serviceCategory).trim(),priority:["normal","high","critical"].includes(priority)?priority:"normal",location:String(location).trim(),notes:notes?String(notes).trim():"",status:"pending_dispatch",dispatchType:"automatic",providerUid:null,providerName:null,pricing:{labor:0,parts:0,discount:0,total:0,commission:0,providerNet:0},payment:{method:null,status:"pending",reference:null},invoice:null,audit:[],createdAt:now(),updatedAt:now()};
  await dispatchAutomatically(order);orders.unshift(order);await persistOrder(order);await audit(order,"order_created",req.user.uid);if(order.providerUid)await audit(order,"automatic_dispatch:"+order.providerUid,"system");io.emit("order_created",order);res.status(201).json({ok:true,order})
});

app.post("/api/orders/:id/assign",requireAuth,requireRole("admin","owner"),async(req,res)=>{
  const o=orders.find(x=>x.orderId===Number(req.params.id));if(!o)return res.status(404).json({ok:false,error:"Order not found"});if(!req.body?.providerUid)return res.status(400).json({ok:false,error:"providerUid is required"});
  o.providerUid=String(req.body.providerUid);o.providerName=req.body.providerName?String(req.body.providerName):null;o.dispatchType=req.body.dispatchType==="manual"?"manual":"automatic";o.status=o.dispatchType==="manual"?"assigned_manual":"assigned_automatic";o.updatedAt=now();await audit(o,"order_assigned",req.user.uid);await persistOrder(o);emitOrder(o);res.json({ok:true,order:o})
});

app.patch("/api/orders/:id/status",requireAuth,async(req,res)=>{
  const o=orders.find(x=>x.orderId===Number(req.params.id));if(!o)return res.status(404).json({ok:false,error:"Order not found"});const next=String(req.body?.status||"");
  if(!STATUS_FLOW.includes(next))return res.status(400).json({ok:false,error:"Invalid order status"});if(!canTransition(o.status,next))return res.status(409).json({ok:false,error:"Invalid status transition",from:o.status,to:next});
  if(req.user.role==="client"&&o.clientUid!==req.user.uid)return res.status(403).json({ok:false,error:"Forbidden"});if(req.user.role==="tech"&&o.providerUid!==req.user.uid)return res.status(403).json({ok:false,error:"Forbidden"});
  o.status=next;o.updatedAt=now();await audit(o,"status_changed:"+next,req.user.uid);await persistOrder(o);emitOrder(o);res.json({ok:true,order:o})
});

app.post("/api/orders/:id/invoice",requireAuth,requireRole("tech","admin","owner"),async(req,res)=>{
  const o=orders.find(x=>x.orderId===Number(req.params.id));if(!o)return res.status(404).json({ok:false,error:"Order not found"});if(req.user.role==="tech"&&o.providerUid!==req.user.uid)return res.status(403).json({ok:false,error:"Forbidden"});
  if(!["in_progress","assigned_automatic","assigned_manual"].includes(o.status))return res.status(409).json({ok:false,error:"Order is not ready for invoicing"});
  const labor=Math.max(0,Number(req.body?.labor)||0),parts=Math.max(0,Number(req.body?.parts)||0),discount=Math.max(0,Number(req.body?.discount)||0),total=Math.max(0,labor+parts-discount),rate=Math.min(100,Math.max(0,Number(process.env.PLATFORM_COMMISSION_RATE||15))),commission=Number((total*rate/100).toFixed(2));
  o.pricing={labor,parts,discount,total,commission,providerNet:Number((total-commission).toFixed(2))};o.invoice={invoiceId:"INV-"+o.orderId+"-"+Date.now(),issuedAt:now(),status:"issued"};o.status="awaiting_payment";o.updatedAt=now();await audit(o,"invoice_issued",req.user.uid);await persistOrder(o);emitOrder(o);res.status(201).json({ok:true,order:o})
});

app.post("/api/orders/:id/payment",requireAuth,async(req,res)=>{
  try{
    const o=orders.find(x=>x.orderId===Number(req.params.id));if(!o)return res.status(404).json({ok:false,error:"Order not found"});
    if(req.user.role==="client"&&o.clientUid!==req.user.uid)return res.status(403).json({ok:false,error:"Forbidden"});
    if(!o.invoice)return res.status(400).json({ok:false,error:"Invoice not issued"});
    if(o.status!=="awaiting_payment")return res.status(409).json({ok:false,error:"Order is not awaiting payment"});
    const method=["online_mada_visa","stc_pay","wallet","cash"].includes(req.body?.method)?req.body.method:null;
    if(!method)return res.status(400).json({ok:false,error:"Invalid payment method"});
    if(method==="cash"&&!["tech","admin","owner"].includes(req.user.role))return res.status(403).json({ok:false,error:"Cash payment must be confirmed by staff"});
    if(!dbEnabled)return res.status(409).json({ok:false,error:"Payment processing requires MySQL"});
    const idempotencyKey=String(req.get("Idempotency-Key")||req.body?.idempotencyKey||"").trim();
    if(!idempotencyKey||idempotencyKey.length>191)return res.status(400).json({ok:false,error:"A valid Idempotency-Key is required"});
    const existing=await db.getPaymentByIdempotency(idempotencyKey);
    if(existing){
      if(existing.orderId!==o.orderId||existing.amount!==Number(o.pricing.total)||existing.method!==method)return res.status(409).json({ok:false,error:"Idempotency key was already used for a different payment"});
      return res.json({ok:true,payment:existing,order:o,idempotent:true});
    }
    const provider=getPaymentProvider(),createdAt=now();
    const created=await provider.createPayment({paymentId:"pending-"+crypto.randomBytes(8).toString("hex"),orderId:o.orderId,amount:Number(o.pricing.total),currency:"SAR",method});
    const payment=await db.createPayment({orderId:o.orderId,clientUid:o.clientUid,amount:Number(o.pricing.total),currency:"SAR",method,provider:provider.name,status:created.status,externalReference:created.externalReference,idempotencyKey,providerMetadata:created.providerMetadata,createdAt,updatedAt:createdAt,paidAt:created.status==="paid"?createdAt:null});
    o.payment={method,status:created.status,reference:created.externalReference||null,paymentId:payment.paymentId};o.updatedAt=now();
    if(created.status==="paid"){o.invoice.status="paid";o.status="completed";await audit(o,"payment_completed:"+payment.paymentId,req.user.uid)}
    else await audit(o,"payment_created:"+payment.paymentId,req.user.uid);
    await persistOrder(o);emitOrder(o);
    res.status(201).json({ok:true,payment,order:o});
  }catch(e){
    console.error("[Oxygen11] Payment error:",e);
    res.status(502).json({ok:false,error:"Payment provider error"});
  }
});
app.post("/api/payments/:id/webhook",async(req,res)=>{
  try{
    if(!dbEnabled)return res.status(409).json({ok:false,error:"Payment webhooks require MySQL"});
    const raw=JSON.stringify(req.body||{}),signature=String(req.get("x-payment-signature")||"");
    const provider=getPaymentProvider();if(!provider.verifyWebhook(raw,signature))return res.status(401).json({ok:false,error:"Invalid webhook signature"});
    const paymentId=Number(req.params.id),payment=await db.getPayment(paymentId);if(!payment)return res.status(404).json({ok:false,error:"Payment not found"});
    if(["paid","failed","cancelled","refunded"].includes(payment.status))return res.json({ok:true,payment,idempotent:true});
    const result=await provider.handleWebhook(req.body||{}),nextStatus=["paid","failed","cancelled","refunded"].includes(result.status)?result.status:"pending";
    const updated=await db.updatePayment(paymentId,{status:nextStatus,externalReference:result.externalReference||payment.externalReference,providerMetadata:result.providerMetadata||payment.providerMetadata,paidAt:nextStatus==="paid"?now():null,updatedAt:now()});
    const o=orders.find(x=>x.orderId===payment.orderId)||await db.getOrder(payment.orderId);if(!o)return res.status(404).json({ok:false,error:"Order not found"});
    o.payment={method:payment.method,status:updated.status,reference:updated.externalReference,paymentId:updated.paymentId};o.updatedAt=now();
    if(nextStatus==="paid"&&o.status==="awaiting_payment"){o.invoice.status="paid";o.status="completed";await audit(o,"payment_completed_webhook:"+paymentId,"payment-provider")}
    else if(["failed","cancelled","refunded"].includes(nextStatus))await audit(o,"payment_"+nextStatus+":"+paymentId,"payment-provider");
    await persistOrder(o);emitOrder(o);res.json({ok:true,payment:updated,order:o});
  }catch(e){console.error("[Oxygen11] Payment webhook error:",e);res.status(500).json({ok:false,error:"Webhook processing failed"})}
});
app.get("/api/audit/orders/:id",requireAuth,requireRole("admin","owner"),async(req,res)=>{const o=orders.find(x=>x.orderId===Number(req.params.id));if(!o)return res.status(404).json({ok:false,error:"Order not found"});res.json({ok:true,audit:dbEnabled?await db.getAudit(o.orderId):(o.audit||[])})});

app.get("/",(req,res)=>{const host=(req.hostname||"").toLowerCase();res.sendFile(path.join(PUBLIC_DIR,hostPages[host]||"index.html"))});
app.use(express.static(PUBLIC_DIR,{extensions:["html"]}));

io.on("connection",socket=>{socket.emit("server_ready",{service:"oxygen11",timestamp:now()});socket.emit("init_orders",orders);socket.on("send_chat_message",(p={})=>io.emit("chat_message",{orderId:Number(p.orderId),sender:String(p.sender||"system"),text:String(p.text||"").slice(0,2000),timestamp:now()}))});
app.use((err,_req,res,_next)=>{console.error("[Oxygen11] Request error:",err);res.status(500).json({ok:false,error:"Internal server error"})});

(async()=>{try{await initPersistence();server.listen(PORT,"0.0.0.0",()=>console.log(`[Oxygen11] Server listening on port ${PORT}`))}catch(e){console.error("[Oxygen11] Startup failed:",e);process.exit(1)}})();
