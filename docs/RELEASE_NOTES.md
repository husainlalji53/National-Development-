# Release 1.1.0 — public-domain SEO update

Public URL: https://national-development-building-mater.vercel.app/

- Removed the preview indexing restriction from the homepage, catalogue and product template.
- Kept enquiry, search/filter results and invalid product pages out of search results.
- Added canonical URLs, language alternatives, robots.txt and a 256-URL bilingual sitemap.
- Added HardwareStore structured data using only supplied business details.
- Added Vercel root configuration for the static `dist` output and deployment/Search Console instructions.
- All 13 Node tests and source checks passed. Live Vercel verification and visual browser QA remain unverified. Search indexing/ranking are not guaranteed.

The notes below describe the previous development release; its public-indexing instructions have been superseded.

# Release 1.0.0 — 17 October 2026

## Completed development phases

1. Approved homepage design and bilingual foundation. Duplicate profile links removed; product photos added.
2. Catalogue of 121 product types, product details, enquiry builder and required email-format validation.
3. Company/contact information, enquiry guide, FAQ accordions, keyboard navigation, mobile and RTL refinements.
4. Final source checks, portable source package and Windows/GitHub handoff documentation.

## Final refinements

- Product-detail links include the product name in their screen-reader labels.
- Catalogue actions and pagination use larger touch targets.
- All images, the company profile, Arabic font and font licence are bundled locally.
- The export excludes Git history, credentials and provider-specific project binding.

## Verification

Passed JavaScript syntax checks and source integrity checks across all four HTML pages, bilingual translations, local assets, internal links, accessibility references, exact Maps destinations and image size budgets. All nine functional tests passed, covering the catalogue, bilingual search, filtering/sorting, invalid saved data, quantities, updates, long enquiries and email-format constraints.

Visual browser automation was unavailable. This is not a browser-tested or accessibility-certified release. Before customer launch, review both languages on a phone and desktop, exercise keyboard navigation, and send a sample enquiry from your own email client. Confirm the saved item list survives a refresh and the provided Maps link opens the correct shop.

## Superseded public-launch notes

Release 1.1.0 replaces the original private-preview indexing configuration for the owner-supplied Vercel URL. Follow `VERCEL_AND_GOOGLE.md`; do not follow older instructions to remove robots tags manually. The original Sites audience remains private. Vercel must receive the new files before this update is live there.

## Assets and operation

The large hero and main category covers are illustrative generated artwork; product photos are extracted from the supplied company profile. The ND mark is the approved design treatment. Keep the bundled font licence. Do not publish supplied imagery or profile content outside the rights you hold for your business.

There is no backend, checkout, payment processing or automatic email service. Selections stay in the browser; customer contact details and generated messages are not persisted by the website. Email addresses are format-checked only. A long enquiry can be copied or downloaded without truncation.
