# National Development — website source

Version 1.1.0 · 17 October 2026

## Open the website on your Windows computer

1. Extract the entire ZIP. Do not open files from inside the ZIP.
2. Open the extracted `National-Development-Website` folder in VS Code.
3. Open Terminal → New Terminal, and run:

```powershell
py -m http.server 3000 --directory dist
```

4. Open http://localhost:3000 in Chrome.
5. Press Ctrl+C in the terminal to stop the server.

If your computer uses `python` instead of `py`, use:

```powershell
python -m http.server 3000 --directory dist
```

No npm install, API key, database or build step is needed. All assets are included. Python starts a local preview; this is not public hosting.

## What is included

- English and Arabic homepage, company information, contact links and FAQs.
- 121 product types, photos, search, filters and product-detail pages.
- Enquiry list, quantities, notes and required email-format validation.
- Email-draft, copy and download options.
- Mobile layout, RTL, keyboard navigation and reduced-motion support.
- Original company-profile PDF and font licence.

Read `GITHUB_SETUP.md` for GitHub instructions and `README.md` for file structure and editing guidance.

## Verify the code

If Node.js is installed:

```powershell
npm.cmd run check
```

`npm.cmd` avoids PowerShell's npm.ps1 execution-policy issue. On macOS/Linux use `npm run check`.

## Important behaviour

The website does not send email itself. Customers review their enquiry and send it through their email application. Copy and download work as alternatives. Email validation checks format, not mailbox ownership or deliverability. Item selections are saved in the customer's browser; contact form details are not persisted by the site.

This handoff contains the complete website source. Public hosting and domain setup are separate. This update is configured for https://national-development-building-mater.vercel.app/. The original Sites preview remains private, but public pages in this package now permit indexing. Upload/redeploy this version to Vercel; creating this ZIP does not update your Vercel account. Start with `VERCEL_AND_GOOGLE.md` for deployment and Search Console instructions.
