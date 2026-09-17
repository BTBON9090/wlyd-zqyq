import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Isolated in-memory demo records; never reads the browser's saved account.
const storage = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,String(value)), removeItem: key => values.delete(key) }; };
globalThis.sessionStorage = storage();
globalThis.localStorage = storage();
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { mockGateway } = await server.ssrLoadModule('/src/dev/mockGateway.ts');
  mockGateway.session = async () => ({id:'workflow-test',phone:'13800000000',name:'测试',enterpriseStatus:'approved'});
  mockGateway.receipts = async () => [];
  const { accountGateway: gateway } = await server.ssrLoadModule('/src/dev/accountGateway.ts');
  const initial = await gateway.load();
  const pending = initial.refunds.find(r=>r.proposal?.status==='pending');
  const originalPaid = initial.orders.find(o=>o.id===pending.orderId).refunded;
  const accepted = await gateway.act({type:'refundProposal',refundId:pending.id,accept:true},'accept-proposal');
  assert.equal(accepted.refunds.find(r=>r.id===pending.id).status,'processing');
  assert.equal(accepted.refunds.find(r=>r.id===pending.id).amount,pending.proposal.amount);
  assert.equal(accepted.orders.find(o=>o.id===pending.orderId).refunded,originalPaid);
  await assert.rejects(gateway.act({type:'refundProposal',refundId:pending.id,accept:false},'repeat-proposal'));
  const eligible = initial.orders.find(o=>o.status==='completed'&&!initial.reviews.some(r=>r.direction==='sent'&&r.orderId===o.id));
  const action = {type:'review',orderId:eligible.id,score:4,content:'验收测试评价',anonymous:true};
  const reviewed = await gateway.act(action,'review');
  const review = reviewed.reviews.find(r=>r.orderId===eligible.id&&r.direction==='sent');
  assert.equal(review.score,4);
  assert.equal(review.anonymous,true);
  assert.equal((await gateway.act(action,'review')).reviews.length,reviewed.reviews.length);
  await assert.rejects(gateway.act(action,'duplicate-review'));
  await gateway.act({type:'reviewFollowup',reviewId:review.id,content:'后续服务反馈'},'followup');
  await assert.rejects(gateway.act({type:'reviewFollowup',reviewId:review.id,content:'重复追评'},'duplicate-followup'));
  const hidden = await gateway.act({type:'reviewVisibility',reviewId:review.id,target:'followup',hidden:true},'hide');
  assert.equal(hidden.reviews.find(r=>r.id===review.id).followup.hidden,true);
  const received = initial.reviews.find(r=>r.direction==='received');
  await assert.rejects(gateway.act({type:'reviewVisibility',reviewId:received.id,target:'review',hidden:true},'hide-other'));
  const rejected = initial.refunds.find(r=>r.status==='rejected');
  const resubmitted = await gateway.act({type:'refund',orderId:rejected.orderId,refundId:rejected.id,amount:500,reason:'补充交付争议说明',description:'已核对交付范围'},'resubmit');
  assert.equal(resubmitted.refunds.find(r=>r.id===rejected.id).description,'已核对交付范围');
  console.log('Account workflows passed: proposal, refund resubmission, review, follow-up, ownership and idempotency.');
} finally { await server.close(); }
