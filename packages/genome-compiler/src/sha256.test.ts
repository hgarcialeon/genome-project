/**
 * Conformance of the compiler-owned SHA-256 (ADR-0011).
 *
 * Expectations are published FIPS 180-4 / NIST vectors plus two pinned
 * multi-byte cases. Nothing here recomputes the algorithm: an implementation
 * checked against itself proves nothing.
 */

import { describe, expect, it } from "vitest";

import { sha256Hex, sha256HexUtf8 } from "./sha256.js";

describe("sha256 (FIPS 180-4 vectors)", () => {
  it("hashes the empty input", () => {
    expect(sha256HexUtf8("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it('hashes "abc" (single block)', () => {
    expect(sha256HexUtf8("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("hashes a 448-bit input (two blocks, padding spills)", () => {
    expect(sha256HexUtf8("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")).toBe(
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    );
  });

  it("hashes one million 'a' characters (long multi-block input)", () => {
    expect(sha256HexUtf8("a".repeat(1_000_000))).toBe(
      "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0",
    );
  });

  it("hashes multi-byte UTF-8 by its encoded bytes", () => {
    expect(sha256HexUtf8("é€💡 — 株式会社")).toBe(
      "2d47750b66bfe20b7d084f92b59e20fdda76b4dbc9757d0006e29e63762a67a1",
    );
  });

  it("hashes canonical JSON containing multi-byte characters", () => {
    expect(sha256HexUtf8('{"z":1,"a":[1,2,{"b":"ü"}]}')).toBe(
      "97dad0ba989928cd1612418de90adef4b860dd1258e03f9056c436dc128c422b",
    );
  });

  it("hashes raw bytes independently of any string encoding", () => {
    expect(sha256Hex(new Uint8Array([0x61, 0x62, 0x63]))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha256Hex(new Uint8Array(0))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("hashes inputs at the 55/56/64-byte padding boundaries", () => {
    expect(sha256HexUtf8("a".repeat(55))).toBe(
      "9f4390f8d30c2dd92ec9f095b65e2b9ae9b0a925a5258e241c9f1e910f734318",
    );
    expect(sha256HexUtf8("a".repeat(56))).toBe(
      "b35439a4ac6f0948b6d6f9e3c6af0f5f590ce20f1bde7090ef7970686ec6738a",
    );
    expect(sha256HexUtf8("a".repeat(64))).toBe(
      "ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb",
    );
  });
});
