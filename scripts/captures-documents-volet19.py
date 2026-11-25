#!/usr/bin/env python3
"""VOLET 19 — captures des documents rendus (page par page) pour
comparaison visuelle avec l'exemple de l'éditeur."""
import asyncio
from playwright.async_api import async_playwright

DOCS = [
    ("/tmp/volet19-proposition.html", "/tmp/volet19-cap-prop", 2),
    ("/tmp/volet19-devis.html", "/tmp/volet19-cap-devis", 3),
]

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 900, "height": 1280})
        for src, prefix, npages in DOCS:
            await page.goto(f"file://{src}", wait_until="load")
            await page.wait_for_timeout(4500)  # polices + pagination
            total = await page.evaluate("window.__pagesPc || 1")
            print(f"{src} -> {total} pages")
            for p in range(1, min(total, npages) + 1):
                await page.evaluate(f"window.postMessage({{type:'aller-page', page: {p}}}, '*')")
                await page.wait_for_timeout(300)
                el = await page.query_selector(f".ppage[data-page='{p}']")
                if el:
                    await el.screenshot(path=f"{prefix}-p{p}.png")
                    print(f"  capture {prefix}-p{p}.png")
        await browser.close()

asyncio.run(main())
