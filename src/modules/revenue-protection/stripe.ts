import { createHmac, timingSafeEqual } from "node:crypto";

export function validStripeSignature(
  payload: string,
  header: string,
  secret: string,
  nowSeconds = Date.now() / 1000,
) {
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/.test(signature)) return false;
    const supplied = Buffer.from(signature, "hex");
    return (
      supplied.length === expected.length && timingSafeEqual(supplied, expected)
    );
  });
}
