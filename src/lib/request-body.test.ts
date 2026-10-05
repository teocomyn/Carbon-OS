import { describe, expect, it } from "vitest";
import { readBoundedJson, RequestBodyTooLarge } from "@/lib/request-body";
describe("bounded JSON bodies", () => {
  it("reads UTF-8 JSON inside the limit", async () => {
    expect(
      await readBoundedJson(
        new Request("https://example.com", {
          method: "POST",
          body: '{"message":"é"}',
        }),
        100,
      ),
    ).toEqual({ message: "é" });
  });
  it("rejects large streamed bodies without trusting Content-Length", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: "x".repeat(101),
    });
    await expect(readBoundedJson(request, 100)).rejects.toBeInstanceOf(
      RequestBodyTooLarge,
    );
  });
  it("rejects malformed JSON", async () => {
    await expect(
      readBoundedJson(
        new Request("https://example.com", { method: "POST", body: "{" }),
        100,
      ),
    ).rejects.toBeInstanceOf(SyntaxError);
  });
});
