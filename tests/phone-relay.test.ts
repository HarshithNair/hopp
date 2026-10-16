import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizePhone,displayPhone,isPhone} from '../lib/phone';

test('the same person is addressable however the number is typed',()=>{
 const dory='+919876543210';
 for(const typed of ['+919876543210','+91 98765 43210','9876543210','98765 43210','09876543210','919876543210','+91-98765-43210','(+91) 98765 43210'])
  assert.equal(normalizePhone(typed),dory,`"${typed}" should resolve to ${dory}`);
});

test('the SOS number normalises to the configured recipient',()=>{
 assert.equal(normalizePhone('+91 99309 23165'),'+919930923165');
});

test('junk is not treated as a phone number',()=>{
 for(const bad of ['','   ','abc','12','+','----']) assert.equal(isPhone(bad),false,`"${bad}" must not be a phone number`);
 // a Supabase UUID must never be mistaken for a number, or cloud sends would break
 assert.equal(isPhone('a1b2c3d4-0000-4000-8000-000000000000'),false);
});

test('numbers are displayed in readable Indian grouping',()=>{
 assert.equal(displayPhone('9876543210'),'+91 98765 43210');
});
