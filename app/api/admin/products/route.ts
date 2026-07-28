import { getDb } from "../../../../db";
import { products } from "../../../../db/schema";

export async function POST(request:Request){
  const body=await request.json() as Record<string,string>;
  if(!body.name||!body.brand||!body.sku) return Response.json({error:"Missing fields"},{status:400});
  const [product]=await getDb().insert(products).values({
    name:body.name.trim(),brand:body.brand.trim(),sku:body.sku.trim().toUpperCase(),
    price:Number(body.price)||0,stock:Number(body.stock)||0,status:body.status==="draft"?"draft":"active",image:body.image||"",
  }).returning();
  return Response.json({product},{status:201});
}
