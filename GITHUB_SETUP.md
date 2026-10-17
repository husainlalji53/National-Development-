# Push your website to GitHub

These instructions push the source from the downloaded ZIP. They do not publish the website or change the existing private preview.

## 1. Create an empty repository

Sign in to your GitHub account and create a repository named `national-development-website` (or a name you prefer). Choose your desired visibility. Start with an empty repository: do not add a README, licence or .gitignore, because this package already contains files.

Copy the repository's HTTPS URL. It will look like:

```text
https://github.com/YOUR_USERNAME/national-development-website.git
```

## 2. Open the extracted folder

Open `National-Development-Website` in VS Code, then open its terminal. Confirm `README.md`, `package.json` and the `dist` folder are in the current directory. Git must be installed.

Run one command at a time:

```powershell
git init
git add .
git commit -m "Add National Development bilingual website"
git branch -M main
```

If Git asks for your identity, set your actual name and your preferred GitHub commit email in this repository, then repeat the commit:

```powershell
git config user.name "YOUR NAME"
git config user.email "YOUR GITHUB COMMIT EMAIL"
git commit -m "Add National Development bilingual website"
```

Add the actual URL you copied, replacing `YOUR_USERNAME` and the repository name as needed:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/national-development-website.git
git push -u origin main
```

Complete Git's sign-in prompt when asked. Do not put passwords or tokens into the URL or source files. Refresh your repository page after the push finishes.

If `origin already exists`, inspect it with `git remote -v`. Correct it only if necessary with `git remote set-url origin YOUR_ACTUAL_REPOSITORY_URL`. If the remote already contains commits, do not force-push; use an empty repository for this first import or merge the existing history deliberately.

## 3. Push later edits

After editing and checking the site:

```powershell
npm.cmd run check
git status
git add .
git commit -m "Update website content"
git push
```

## Hosting

GitHub stores the code; pushing a repository alone does not create a live website. For static hosting, publish the contents of `dist` as the site root, with no build command required. All URLs are relative, so hosting under a subdirectory also works. Do not publish the whole project root as your website root.

The source ZIP omits the original provider's project binding and Git history. No connection to the existing Sites repository is needed. See `docs/RELEASE_NOTES.md` before opening the site to customers or allowing search indexing.
