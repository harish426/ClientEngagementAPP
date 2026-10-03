from typing import Optional, Dict, Any
import httpx
import dns.resolver
import dns.reversename
from backend.app.core.config import get_settings

CONSUMER_ISPS = {
    "comcast", "verizon", "att", "charter", "spectrum", "vodafone",
    "t-mobile", "orange", "telecom", "broadband", "residential", "dynamic",
    "aws", "amazon", "google", "microsoft", "digitalocean", "cloudflare", "fastly"
}

class IPResolverService:
    def __init__(self):
        self.settings = get_settings()

    async def resolve_ip(self, ip_address: str) -> Optional[Dict[str, Any]]:
        """
        Resolves IP to corporate domain:
        1. Checks B2B IP enrichment API (IPinfo Company API or Snitcher)
        2. Falls back to Reverse DNS PTR query
        3. Filters out residential ISPs and public clouds
        """
        if not ip_address or ip_address in ["127.0.0.1", "::1", "localhost"]:
            return None

        # Try API enrichment if token is configured
        if self.settings.IPINFO_API_TOKEN and self.settings.IPINFO_API_TOKEN != "demo_token":
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    resp = await client.get(
                        f"https://ipinfo.io/{ip_address}?token={self.settings.IPINFO_API_TOKEN}"
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        company = data.get("company", {})
                        if company.get("type") == "business" and company.get("domain"):
                            return {
                                "company_name": company.get("name"),
                                "domain": company.get("domain").lower(),
                                "city": data.get("city"),
                                "country": data.get("country"),
                                "confidence": "high"
                            }
            except Exception:
                pass

        # Fallback to reverse DNS
        try:
            rev_name = dns.reversename.from_address(ip_address)
            ptr_records = dns.resolver.resolve(rev_name, "PTR", lifetime=1.5)
            hostname = str(ptr_records[0]).rstrip(".").lower()

            # Filter out consumer ISPs
            if any(isp in hostname for isp in CONSUMER_ISPS):
                return None

            parts = hostname.split(".")
            if len(parts) >= 2:
                domain = ".".join(parts[-2:])
                return {
                    "company_name": domain.split(".")[0].capitalize(),
                    "domain": domain,
                    "confidence": "medium"
                }
        except Exception:
            pass

        return None
