import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validStripeSignature } from "../../src/modules/revenue-protection/stripe";

describe("Stripe webhook signatures", () => {
  it("accepts a current matching signature and rejects tampering", () => {
    const timestamp = 1_800_000_000;
    const payload = JSON.stringify({ id: "evt_test" });
    const secret = "whsec_synthetic_test";
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    const header = `t=${timestamp},v1=${signature}`;
    expect(validStripeSignature(payload, header, secret, timestamp + 10)).toBe(
      true,
    );
    expect(
      validStripeSignature(`${payload}x`, header, secret, timestamp + 10),
    ).toBe(false);
    expect(validStripeSignature(payload, header, secret, timestamp + 301)).toBe(
      false,
    );
  });
});
