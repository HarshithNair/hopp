import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {messageSchema,sosSchema,hazardSchema,operationSchema,verifySignature} from '../server/validation';
test('payment signatures bind the payment to the stored order',()=>{const s=createHmac('sha256','test-secret').update('order_1|pay_1').digest('hex');assert.equal(verifySignature('order_1','pay_1',s,'test-secret'),true);assert.equal(verifySignature('order_2','pay_1',s,'test-secret'),false);assert.equal(verifySignature('order_1','pay_1','bad','test-secret'),false)});
test('message has one valid destination and bounded content',()=>{const recipient_id='123e4567-e89b-42d3-a456-426614174000';assert.equal(messageSchema.safeParse({body:'hello',recipient_id}).success,true);assert.equal(messageSchema.safeParse({body:'hello',recipient_id,group_id:recipient_id}).success,false);assert.equal(messageSchema.safeParse({body:'hello'}).success,false);assert.equal(messageSchema.safeParse({body:'a'.repeat(4001),recipient_id}).success,false)});
test('SOS validates locations and discards forged acknowledgments',()=>{assert.equal(sosSchema.safeParse({category:'Medical',latitude:95}).success,false);assert.equal('acknowledged_at' in sosSchema.parse({category:'Medical',acknowledged_at:'now'}),false)});
test('community reports cannot self verify',()=>{const d=hazardSchema.parse({kind:'Hazard',description:'Blocked road',latitude:12,longitude:77,severity:'yellow',verified:true});assert.equal('verified' in d,false)});
test('sync cannot accept arbitrary table operations',()=>{assert.equal(operationSchema.safeParse({id:'123e4567-e89b-42d3-a456-426614174000',type:'orders',data:{status:'paid'}}).success,false)});
