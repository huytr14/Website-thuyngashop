import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { orders } from "../../../../../db/schema";

const allowed=["new","confirmed","shipping","completed","cancelled"] as const;
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const body=await request.json() as {status?:typeof allowed[number]};
  if(!body.status||!allowed.includes(body.status)) return Response.json({error:"Invalid status"},{status:400});
  const {id}=await params;
  await getDb().update(orders).set({status:body.status}).where(eq(orders.id,Number(id)));
  return Response.json({ok:true});
}
