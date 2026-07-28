import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { products } from "../../../../../db/schema";

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  await getDb().delete(products).where(eq(products.id,Number(id)));
  return Response.json({ok:true});
}
