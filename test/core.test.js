const test=require("node:test");
const assert=require("node:assert/strict");
const {canTransition,transitionAllowed,hasPermission}=require("../backend/workflow/order_workflow");
const {parseCoords,serviceMatches,distance,rankProviders}=require("../backend/dispatch_engine/ranking");

test("workflow permits only declared transitions",()=>{
  assert.equal(canTransition("pending_dispatch","assigned_automatic"),true);
  assert.equal(canTransition("completed","in_progress"),false);
  assert.equal(canTransition("awaiting_payment","completed"),true);
});
test("role transition policy is enforced",()=>{
  assert.equal(transitionAllowed("tech","assigned_automatic","in_progress"),true);
  assert.equal(transitionAllowed("tech","awaiting_payment","completed"),false);
  assert.equal(transitionAllowed("client","awaiting_payment","completed"),false);
  assert.equal(transitionAllowed("admin","in_progress","awaiting_payment"),true);
});
test("permissions are centralized",()=>{
  assert.equal(hasPermission("owner","anything"),true);
  assert.equal(hasPermission("admin","registry.write"),true);
  assert.equal(hasPermission("tech","registry.write"),false);
  assert.equal(hasPermission("client","orders.create"),true);
});
test("coordinates parse and distance is sane",()=>{
  const a=parseCoords("21.4225, 39.8262");
  assert.deepEqual(a,{lat:21.4225,lng:39.8262});
  const d=distance(a,{latitude:21.4225,longitude:39.8262});
  assert.equal(d,0);
});
test("dispatch ranking filters and sorts eligible providers",()=>{
  const providers=[
    {uid:"far",fullName:"Far",serviceTypes:["ac"],status:"active",available:true,latitude:21.50,longitude:39.90,lastAssignedAt:"2026-09-25T09:00:00Z"},
    {uid:"near",fullName:"Near",serviceTypes:["ac"],status:"active",available:true,latitude:21.423,longitude:39.827,lastAssignedAt:"2026-09-25T10:00:00Z"},
    {uid:"off",fullName:"Off",serviceTypes:["ac"],status:"active",available:false,latitude:21.422,longitude:39.826},
    {uid:"wrong",fullName:"Wrong",serviceTypes:["plumbing"],status:"active",available:true,latitude:21.422,longitude:39.826}
  ];
  const ranked=rankProviders(providers,{serviceCategory:"AC maintenance",latitude:21.4225,longitude:39.8262});
  assert.deepEqual(ranked.map(p=>p.uid),["near"]);
});
