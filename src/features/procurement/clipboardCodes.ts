type CodeProduct = { id: string; name: string; sku: string; code?: string };
export type ClipboardCode = { code: string; productName: string };

/** Only expose catalogued product codes, never unrelated clipboard contents. */
export function recognizeClipboardCodes(text: string, products: CodeProduct[]): ClipboardCode[] {
  const source=text.slice(0,10000), found: (ClipboardCode & {position:number})[]=[];
  const seen=new Set<string>();
  for(const product of products)for(const code of [product.code,product.sku]){
    if(!code||seen.has(code.toLowerCase()))continue;
    const escaped=code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const match=new RegExp(`(?:^|[^a-z0-9_.-])(${escaped})(?=$|[^a-z0-9_.-])`,'i').exec(source);
    if(match){seen.add(code.toLowerCase());found.push({code,productName:product.name,position:match.index})}
  }
  return found.sort((a,b)=>a.position-b.position).slice(0,8).map(({code,productName})=>({code,productName}));
}
