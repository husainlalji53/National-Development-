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

## Public launch decisions

The current hosted site remains owner-private. Its HTML has `noindex,nofollow`; that directive is not access control when you upload the files to another host.

Confirm the final public domain, business wording in Arabic, full opening hours and any delivery terms before public release. Exact stock, prices, models and delivery promises have not been invented. Two broad brochure descriptions, “Battery accessories” and “Oil filter range”, should be confirmed if you want more precise naming.

Once the domain and public launch are approved, remove `noindex,nofollow` from all four HTML files, update the corresponding private-preview assertion in `scripts/check.mjs`, and add canonical URLs, sitemap and verified structured business data appropriate to that domain. Do not replace domain placeholders with guessed values.

## Assets and operation

The large hero and main category covers are illustrative generated artwork; product photos are extracted from the supplied company profile. The ND mark is the approved design treatment. Keep the bundled font licence. Do not publish supplied imagery or profile content outside the rights you hold for your business.

There is no backend, checkout, payment processing or automatic email service. Selections stay in the browser; customer contact details and generated messages are not persisted by the website. Email addresses are format-checked only. A long enquiry can be copied or downloaded without truncation.
