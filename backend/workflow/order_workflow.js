const STATUS_FLOW=["pending_dispatch","assigned_automatic","assigned_manual","in_progress","awaiting_payment","completed","cancelled"];
const transitions={pending_dispatch:["assigned_automatic","assigned_manual","cancelled"],assigned_automatic:["in_progress","cancelled"],assigned_manual:["in_progress","cancelled"],in_progress:["awaiting_payment","cancelled"],awaiting_payment:["completed","cancelled"],completed:[],cancelled:[]};
const ROLE_PERMISSIONS={owner:["*"],admin:["orders.read","orders.create","orders.assign","orders.update","providers.read","providers.write","registry.read","registry.write","audit.read","payments.read"],tech:["orders.read","orders.update","providers.read","payments.confirm"],client:["orders.read","orders.create","payments.create"]};
function canTransition(a,b){return(transitions[a]||[]).includes(b)}
function transitionAllowed(role,from,to){if(role==="owner"||role==="admin")return canTransition(from,to);if(role==="tech")return (from==="assigned_automatic"||from==="assigned_manual")&&["in_progress","cancelled"].includes(to);if(role==="client")return from==="awaiting_payment"&&to==="cancelled";return false}
function hasPermission(role,permission){const p=ROLE_PERMISSIONS[role]||[];return p.includes("*")||p.includes(permission)}
module.exports={STATUS_FLOW,transitions,ROLE_PERMISSIONS,canTransition,transitionAllowed,hasPermission};
