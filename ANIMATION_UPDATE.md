# Animation update — v1.2.1

Five approved additions: word-by-word hero reveal; bilingual category word rotator without visible controls (one short automatic pass, then stays still); staggered category-card entrance; sequential process lines (horizontal on desktop, vertical on narrow screens); checkmark feedback when adding an enquiry item.

Reduced-motion preferences disable movement. The rotator pauses when the page is hidden or the hero leaves view. No new libraries, fake reviews, sales, prices, or checkout were added.

Google verification HTML, robots.txt, sitemap, email validation and catalogue data are included.

Validation: all 13 existing functional/SEO tests and source checks passed. Desktop browser inspection covered English/Arabic hero layouts and Arabic catalogue add-to-enquiry feedback. Mobile CSS and reduced-motion rules were reviewed in source; real mobile-device testing has not been performed.

## Update your GitHub/Vercel project

Copy the contents of this folder into your existing Git-connected project folder, replacing matching files. Preserve its .git folder. Do not run git init in this extracted ZIP.

In PowerShell, from your original project folder:

    git status
    git add dist scripts/check.mjs package.json ANIMATION_UPDATE.md
    git commit -m "Add five approved website animations"
    git push origin main

This package does not include .git or private Sites hosting settings. Your Vercel deployment updates after the GitHub push if automatic deployments are connected.
