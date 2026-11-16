import test from 'node:test';
import assert from 'node:assert/strict';
import { groupCartRows, selectCartItems } from '../src/features/procurement/cartGroups.ts';
const row=(id,supplierId)=>({item:{productId:id,quantity:2,selected:true,remark:'保留备注'},product:supplierId?{supplierId,supplierName:'同名店铺'}:undefined});
test('groups interleaved products by supplier ID, preserving row order and unavailable items',()=>{
 const rows=[row('a','s1'),row('b','s2'),row('c','s1'),row('d'),row('e')];
 const groups=groupCartRows(rows);
 assert.deepEqual(groups.map(g=>g.rows.map(r=>r.item.productId)),[['a','c'],['b'],['d','e']]);
 assert.deepEqual(groups.map(g=>g.name),['同名店铺','同名店铺','已失效商品']);
 assert.equal(groupCartRows([]).length,0);
});
test('group selection changes only target products and preserves quantity and remarks',()=>{
 const original=[row('a','s1').item,row('b','s2').item,row('c','s1').item];
 const next=selectCartItems(original,['a','c'],false);
 assert.deepEqual(next.map(i=>i.selected),[false,true,false]);
 assert.deepEqual(original.map(i=>i.selected),[true,true,true]);
 assert.equal(next[1],original[1]);
 assert.equal(next[0].quantity,2); assert.equal(next[0].remark,'保留备注');
 assert.deepEqual(selectCartItems(next,['a','c'],true),original);
});
