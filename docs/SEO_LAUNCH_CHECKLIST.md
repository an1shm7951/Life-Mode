# LifeMode SEO and indexing checklist

**Canonical site:** https://lifemode.vercel.app  
**Prepared:** 27 November 2026

## Implemented in this branch

- Distinctive page title and description centered on "LifeMode — Your Personal Operating System".
- Per-page canonical URLs for the homepage, About, Privacy and Terms.
- Open Graph and large-image Twitter metadata.
- A generated 1200 × 630 Open Graph image at `/opengraph-image`.
- Organization, WebSite and SoftwareApplication JSON-LD on the homepage. No review count, rating, price or unsupported feature claims are fabricated.
- XML sitemap containing only intended public pages.
- Robots rules and `X-Robots-Tag` response headers for account, authentication and private app routes.
- A public About page with substantive product information.

## After this branch is deployed

### Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console/).
2. Add the URL-prefix property `https://lifemode.vercel.app/`.
3. Complete one of the offered ownership-verification methods. HTML meta-tag verification can be added to the Next.js metadata after the verification token is supplied; DNS verification requires access to the domain's DNS provider.
4. Submit `https://lifemode.vercel.app/sitemap.xml`.
5. Use URL Inspection on the homepage and About page.
6. Confirm that Google can fetch the pages, sees the intended canonical URL and does not report a noindex or robots block.
7. Request indexing for the homepage and About page.
8. Recheck Page indexing and Core Web Vitals reports over time.

### Bing Webmaster Tools

1. Open [Bing Webmaster Tools](https://www.bing.com/webmasters/).
2. Add and verify the canonical site.
3. Submit `https://lifemode.vercel.app/sitemap.xml`.
4. Inspect the homepage and About page.

### Brand discovery

- Use "LifeMode — Your Personal Operating System" consistently in the page title, social profiles and launch materials.
- Link official social profiles from the site only after the accounts are created and verified.
- Use the same brand mark and product description across public profiles.
- Publish useful, original product explanations rather than keyword-stuffed pages.
- Consider a distinctive custom domain when one is secured and configured; do not change the canonical host until redirects and domain ownership are verified.

## Verification checklist

- [ ] Production homepage returns HTTP 200 to a normal browser and a crawler.
- [ ] `/robots.txt` is reachable and does not disallow public pages.
- [ ] `/sitemap.xml` is reachable, valid XML and contains only canonical public pages.
- [ ] Homepage, About, Privacy and Terms each emit the expected canonical URL.
- [ ] Public pages do not emit `noindex`.
- [ ] Private and authentication routes emit `X-Robots-Tag: noindex, nofollow, noarchive`.
- [ ] Open Graph image returns a valid 1200 × 630 image.
- [ ] Structured data passes Google's Rich Results Test / Schema Markup Validator without invented claims.
- [ ] Search Console and Bing verification and sitemap submission are complete.

## Expectations

A sitemap and Search Console submission help discovery but do not guarantee indexing, rankings or a particular result appearance. Search engines decide when and whether to index pages. Brand searches may also be competitive because other products use similar names.
