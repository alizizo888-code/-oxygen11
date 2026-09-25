const test=require("node:test");
const assert=require("node:assert/strict");
const {validCoordinatePair,validPhone,cleanString,validateOrderInput}=require("../backend/security/security");

test("security validation accepts valid coordinates",()=>{
  assert.equal(validCoordinatePair(21.4225,39.8262),true);
  assert.equal(validCoordinatePair(null,null),true);
});

test("security validation rejects invalid coordinates",()=>{
  assert.equal(validCoordinatePair(91,39),false);
  assert.equal(validCoordinatePair(21,181),false);
  assert.equal(validCoordinatePair("x",39),false);
});

test("security validation rejects malformed phone",()=>{
  assert.equal(validPhone("+966 500 123 456"),true);
  assert.equal(validPhone("abc"),false);
});

test("order validation enforces required fields and bounds",()=>{
  assert.equal(validateOrderInput({clientName:"Ali",phone:"+966500123456",serviceCategory:"AC",location:"Makkah",latitude:21.4,longitude:39.8,priority:"normal"}),null);
  assert.equal(validateOrderInput({clientName:"",phone:"+966500123456",serviceCategory:"AC",location:"Makkah"}),"Invalid order fields");
  assert.equal(validateOrderInput({clientName:"Ali",phone:"+966500123456",serviceCategory:"AC",location:"Makkah",latitude:99,longitude:39}),"Invalid coordinates");
  assert.equal(cleanString("  hello  ",10),"hello");
  assert.equal(cleanString("x".repeat(11),10),null);
});
