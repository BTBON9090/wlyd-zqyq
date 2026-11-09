import assert from 'node:assert/strict';
import { createServer } from 'vite';
const values = new Map();
const storage = {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
globalThis.localStorage=storage;globalThis.sessionStorage=storage;
Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
globalThis.fetch=()=>{throw new Error('独立原型不得请求后端');};
const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
try {
 const {authenticatePreview,changePreviewPassword}=await server.ssrLoadModule('/src/dev/previewAuth.ts');
 const {uatRequest}=await server.ssrLoadModule('/src/uat/api.ts');
 assert.equal((await authenticatePreview('preview_buyer','DemoPreview123!')).enterpriseStatus,'approved');
 await assert.rejects(authenticatePreview('preview_buyer','invalid-password'));
 const registered=await authenticatePreview('example_buyer','ExamplePass123!','演示注册用户');
 assert.equal(registered.enterpriseStatus,'none');
 await assert.rejects(authenticatePreview('example_buyer','ExamplePass123!','重复注册'));
 assert.equal((await authenticatePreview('example_buyer','ExamplePass123!')).name,'演示注册用户');
 await assert.rejects(changePreviewPassword('incorrect-password','ChangedPass123!'));
 await uatRequest('/auth/password',{method:'POST',body:JSON.stringify({currentPassword:'ExamplePass123!',newPassword:'ChangedPass123!'})});
 await assert.rejects(authenticatePreview('example_buyer','ExamplePass123!'));
 await authenticatePreview('example_buyer','ChangedPass123!');
 assert.equal((await uatRequest('/parks')).length,3);
 await assert.rejects(uatRequest('/unknown'),/尚未提供本地模拟/);
 console.log('PASS: 本地登录、注册、密码校验与修改；园区读取；全程零后端请求。');
} finally {await server.close();}
