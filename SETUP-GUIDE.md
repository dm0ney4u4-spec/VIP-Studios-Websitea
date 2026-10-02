# VIP Studios - Free Hosting + No-Code Editor Setup

## Part 1 - Create the GitHub repository

1. Go to GitHub and sign in or make a free account.
2. Click **+** in the top-right, then **New repository**.
3. Name it `vip-studios-website`.
4. Choose **Private** if you do not want the code/content browsable by everyone.
5. Create the repository.
6. On the empty repository page, choose the option to upload existing files.
7. Upload the **contents** of this folder, including the hidden `.pages.yml` file.
8. Commit the upload to the `main` branch.

Important: `.pages.yml` must be at the repository root, beside `index.html`.

## Part 2 - Connect Pages CMS

1. Open `https://app.pagescms.org`.
2. Click **Sign in with GitHub**.
3. Install/authorize the Pages CMS GitHub App when asked.
4. Give it access to your `vip-studios-website` repository.
5. Select that repository inside Pages CMS.
6. Pages CMS should detect `.pages.yml` automatically.
7. You will see editors for:
   - Site Settings
   - Chain of Command
   - Staff Members & Portfolios
   - Projects
   - Updates
8. Edit something small and save it to confirm Pages CMS can write to the repository.

## Part 3 - Publish on Netlify for free

1. Open `https://app.netlify.com` and create/sign into a free account.
2. From the dashboard choose **Add new project** / **Import an existing project**.
3. Choose **GitHub**.
4. Authorize Netlify and select `vip-studios-website`.
5. Netlify should detect this as a static site.
6. Build command: leave blank / none.
7. Publish directory: `.` (the repository root). `netlify.toml` already contains this setting.
8. Click **Deploy** / **Publish**.
9. Netlify will give you a public address ending in `.netlify.app`.
10. In Netlify's domain/site settings, rename the generated site name if you want a cleaner free address and the name is available.

## Part 4 - Your normal editing workflow

After setup, you should not need VS Code for normal content changes.

1. Go to `https://app.pagescms.org`.
2. Sign in.
3. Open `vip-studios-website`.
4. Choose what you want to edit.
5. Change text, add/remove staff, upload photos, add projects, add updates, etc.
6. Press **Save**.
7. Pages CMS commits the change to GitHub.
8. Netlify automatically sees the GitHub change and starts a new deploy.
9. Refresh your live website after the deploy finishes.

## Adding a staff member

Open **Staff Members & Portfolios** in Pages CMS, add an item, and fill in:
- Roblox username
- Display name
- Rank
- Staff photo/avatar
- Portfolio description
- Visibility
- Display order

## Adding an update

Open **Updates**, add an item, and fill in:
- Title
- Date
- Category
- Update text
- Optional image
- Optional link
- Show/hide toggle

## Adding projects later

1. Open **Projects** and add project entries.
2. Go to **Site Settings > Projects Section**.
3. Change **Projects Display Mode** from **Under Construction** to **Show Projects**.
4. Save.

The construction tape disappears automatically and the project cards appear.

## Security basics

- Turn on two-factor authentication for GitHub and Netlify.
- Give Pages CMS access only to the repository it needs.
- Never store Discord bot tokens, passwords, API secrets, or private keys in these website files.
- Keep the repository private if you do not want the source/content files publicly browsable.
