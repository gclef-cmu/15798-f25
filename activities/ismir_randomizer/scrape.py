#!/usr/bin/env python3

import json
import sys
from typing import Dict, List, Set

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


def fetch_pdf_links_for_year(year: int) -> List[str]:
    """
    Fetch all unique PDF links from the ISMIR conference page for the given year,
    skipping the first "Download PDF" link on the page.

    Returns a list (stable order based on appearance, de-duplicated) of URLs.
    """
    base_url_no_slash = f"https://ismir.net/conferences/ismir-{year}"
    base_url = base_url_no_slash + "/"

    # Use a browser-like set of headers to avoid 406 responses (WAFs sometimes reject default clients)
    primary_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/118.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;q=0.9,"
            "image/avif,image/webp,image/apng,*/*;q=0.8"
        ),
        "Accept-Language": "en-US,en;q=0.9",
        "DNT": "1",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    }
    alt_headers = {
        **primary_headers,
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/127.0.0.0 Safari/537.36"
        ),
    }

    session = requests.Session()

    def try_fetch(u: str, headers: Dict[str, str]) -> requests.Response | None:
        try:
            resp = session.get(u, headers=headers, timeout=30)
            # Some sites return 406 with default headers; only treat 2xx as success
            if 200 <= resp.status_code < 300:
                return resp
            return None
        except requests.RequestException:
            return None

    # Try a few combinations: with/without trailing slash and alternate UA
    response = (
        try_fetch(base_url, primary_headers)
        or try_fetch(base_url_no_slash, primary_headers)
        or try_fetch(base_url, alt_headers)
        or try_fetch(base_url_no_slash, alt_headers)
    )

    if response is None:
        print(
            f"Warning: failed to fetch {base_url} with browser-like headers",
            file=sys.stderr,
        )
        return []

    soup = BeautifulSoup(response.text, "html.parser")

    # Find all anchors whose visible text matches "Download PDF"
    anchors = []
    for a in soup.find_all("a"):
        text = (a.get_text() or "").strip()
        if text.lower() == "download pdf":
            anchors.append(a)

    if not anchors:
        return []

    # Skip the first occurrence on the page per requirements
    anchors = anchors[1:]

    # Collect hrefs, maintaining order but de-duplicating via a seen set
    seen: Set[str] = set()
    hrefs: List[str] = []
    for a in anchors:
        href = a.get("href")
        if not href:
            continue
        href = href.strip()
        if not href:
            continue
        # Normalize relative URLs to absolute using the page's URL
        absolute_href = urljoin(response.url, href)
        if absolute_href not in seen:
            seen.add(absolute_href)
            hrefs.append(absolute_href)

    return hrefs


def main() -> None:
    start_year = 2000
    end_year = 2024

    results: Dict[int, List[str]] = {}

    for year in range(start_year, end_year + 1):
        links = fetch_pdf_links_for_year(year)
        results[year] = links
        print(f"{year}: {len(links)} links")

    # Write out JSON with years as numbers (keys will be strings in JSON by spec)
    out_path = "ismir_pdfs_2010_2024.json"
    try:
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"Wrote {out_path}")
    except OSError as exc:
        print(f"Error writing {out_path}: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
