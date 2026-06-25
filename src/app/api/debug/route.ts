export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  return Response.json({
    defined: !!url,
    length: url.length,
    prefix: url.substring(0, 25),
    suffix: url.substring(Math.max(0, url.length - 15)),
  });
}
