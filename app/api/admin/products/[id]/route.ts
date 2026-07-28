import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { products } from "../../../../../db/schema";

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  if (!(await getChatGPTUser())) return Response.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  await getDb().delete(products).where(eq(products.id,Number(id)));
  return Response.json({ok:true});
}
