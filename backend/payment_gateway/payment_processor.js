const crypto=require("crypto");

class MockPaymentProvider{
  constructor(){this.name="mock";this.autoConfirm=String(process.env.MOCK_PAYMENT_AUTO_CONFIRM||"false").toLowerCase()==="true";}
  async createPayment({paymentId,orderId,amount,currency,method}) {
    const externalReference=`MOCK-${paymentId}-${crypto.randomBytes(6).toString("hex")}`;
    return {status:this.autoConfirm?"paid":"pending",externalReference,providerMetadata:{mode:"mock",orderId,amount,currency,method,autoConfirm:this.autoConfirm}};
  }
  verifyWebhook(payload,signature){
    const secret=process.env.PAYMENT_WEBHOOK_SECRET;
    if(!secret)return false;
    const expected=crypto.createHmac("sha256",secret).update(payload).digest("hex");
    return typeof signature==="string"&&signature.length===expected.length&&crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(signature));
  }
  async handleWebhook(){return {status:"pending"};}
}

function getPaymentProvider(){
  const name=String(process.env.PAYMENT_PROVIDER||"mock").toLowerCase();
  if(name==="mock")return new MockPaymentProvider();
  throw new Error(`Unsupported payment provider: ${name}. Configure a provider adapter before enabling it.`);
}

module.exports={getPaymentProvider,MockPaymentProvider};