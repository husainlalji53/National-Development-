# Deploy version 1.1.0 and submit it to Google

Public website: https://national-development-building-mater.vercel.app/

## 1. Replace the previous files and redeploy

Extract the ZIP and copy its contents into your existing website project folder, replacing matching files. Preserve your existing `.git` folder and repository connection. Do not place the new project inside another nested project folder.

The complete project root contains `vercel.json`, `package.json` and `dist`. The included Vercel configuration selects the static `dist` output and keeps `.html` URLs. No framework or build is needed. Configure the Vercel project root as the project folder containing `vercel.json`, not `dist`, when deploying this full package.

If Vercel is connected to your GitHub repository, commit and push the changes from your local project:

```powershell
npm.cmd run check
git add .
git commit -m "Configure public website SEO for Vercel"
git push
```

Confirm Vercel completes a production deployment for the intended domain. If your project is not connected to GitHub, redeploy the updated project through your existing Vercel deployment method. This code package does not itself update Vercel or submit anything to Google.

## 2. Check the public deployment

Open these URLs in a signed-out/incognito browser:

- https://national-development-building-mater.vercel.app/
- https://national-development-building-mater.vercel.app/robots.txt
- https://national-development-building-mater.vercel.app/sitemap.xml
- https://national-development-building-mater.vercel.app/product.html?id=helmets
- https://national-development-building-mater.vercel.app/?lang=ar

They must load without sign-in. View the homepage source: its robots tag should be `index,follow,max-image-preview:large`. Make sure the production HTTP response does not include an `X-Robots-Tag: noindex` header. Avoid testing only a protected preview deployment.

The enquiry page deliberately stays noindex. Do not add a robots.txt block for it; Google needs to crawl it to see the noindex tag. Canonical/alternate tags and product content are JavaScript-rendered, so inspect the rendered page using Search Console as well as the initial HTML.

## 3. Add the site in Google Search Console

Open https://search.google.com/search-console and add a URL-prefix property for:

```text
https://national-development-building-mater.vercel.app/
```

Use a verification method Google offers for that property. If you choose an HTML verification file, put the exact downloaded file in `dist` and redeploy; it must be accessible at the domain root. If you choose an HTML meta tag, insert Google's exact tag into the `<head>` of `dist/index.html` and redeploy. Do not invent a verification token.

After verification, submit `sitemap.xml` in the Sitemaps section. Use URL Inspection for the homepage, run a live test, and request indexing. Check a representative product and Arabic URL to confirm rendered content and canonical links are recognised.

The sitemap lists 256 canonical URLs: homepage, six catalogue pages and 121 product types, each in English and Arabic. It excludes enquiry and filtered-search URLs.

## 4. Connect your business listing

Add this website address to the existing Google Business Profile for NATIONAL DEVELOPMENT BUILDING MATERIAL AND HARDWARE. Keep the name, phone and address consistent, and supply accurate opening hours through the business profile. Do not create a duplicate listing.

## What this update does not promise

Google decides whether and when to index pages and where they rank. Search Console submission and structured data do not guarantee inclusion, a particular position, or a rich result. Source checks have passed; this workspace could not verify the live Vercel deployment or complete visual browser testing.

## Official references

- https://developers.google.com/search/docs/crawling-indexing/block-indexing
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/search/docs/appearance/structured-data/local-business
- https://vercel.com/docs/project-configuration/vercel-json
