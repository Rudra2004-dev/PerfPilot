import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { z } from "zod";

export class UrlError extends Error {}

// Every address range a public website should never resolve to
const blocked = new BlockList();

const V4: [string, number][] = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24],
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];
const V6: [string, number][] = [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["64:ff9b::", 96], // NAT64
  ["2001:db8::", 32], // documentation
  ["fc00::", 7], // unique local (private)
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
];
for (const [net, prefix] of V4) blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of V6) blocked.addSubnet(net, prefix, "ipv6");

function isBlockedIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 0) return true; // not a valid IP: refuse
  try {
    return blocked.check(ip, family === 4 ? "ipv4" : "ipv6");
  } catch {
    return true; // when in doubt, block
  }
}

const InputSchema = z.string().trim().min(1).max(2048);

// Returns a safe, normalized URL, or throws UrlError with a user-friendly message.
export async function validateTarget(input: unknown): Promise<string> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) throw new UrlError("Please provide a URL.");
  const raw = parsed.data;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new UrlError("That doesn't look like a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UrlError("Only http and https URLs are supported.");
  }
  if (url.username || url.password) {
    throw new UrlError("URLs with embedded credentials are not allowed.");
  }
  if (url.port) {
    // the URL class drops default ports, so any port left here is non-standard
    throw new UrlError("Only the default web ports (80 and 443) are allowed.");
  }

  const host = url.hostname.replace(/^\[|\]$/g, ""); // strip [] from IPv6 literals
  if (isIP(host) === 0 && !host.includes(".")) {
    throw new UrlError("Please enter a public website address.");
  }

  // Check EVERY address the name resolves to, not just the first one
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UrlError("Could not find that website (DNS lookup failed).");
  }
  if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) {
    throw new UrlError("That address is not allowed.");
  }

  return url.toString();
}