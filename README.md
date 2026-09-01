# Farmer Procurement Scheduling Prototype

This project is a beginner-friendly hackathon prototype for Smart India Hackathon 2026, Problem ID 26032.

## Project goal
The application helps farmers:
- book procurement slots for their crops
- check queue position and waiting time
- view booking status and slot details
- receive SMS-style slot confirmation notifications

## How to run locally

Use the main app in the project root:
- [server.js](server.js)
- [public/index.html](public/index.html)
- [public/style.css](public/style.css)
- [public/script.js](public/script.js)

Run in VS Code terminal:

```bash
npm install
node server.js
```

Then open:

```text
http://localhost:3000
```

## GitHub Desktop push workflow

Use GitHub Desktop instead of command-line Git:

1. Open GitHub Desktop.
2. Click Add local repository.
3. Choose this project folder.
4. Review the changed files.
5. Write a clear commit message, such as:
   ```text
   Add farmer procurement scheduling prototype
   ```
6. Click Commit to main.
7. Click Publish repository or Push origin.
8. If asked, sign in to GitHub and choose a repository name.

This keeps the workflow simple and matches your requirement of not using terminal Git commands.

## Deployment options

### 1. Cheapest setup
Use the local Express app above.
- No paid hosting required
- Works on your machine for demo and testing

### 2. Free public demo route
If you want a no-cost public preview later, convert the frontend into a static GitHub Pages version.

### 3. Free backend hosting
The app is also ready to deploy to a free Node host such as Render using [render.yaml](render.yaml).

## Folder structure

```text
Farmer_procurement_Schedules_Problem/
├── public/                  # Express-served frontend files
├── server.js                # Express API backend
├── package.json             # Node.js dependencies and scripts
├── render.yaml              # free hosting config
├── README.md                # project guide
├── .gitignore               # Git cleanup file
└── .github/                 # custom mentor agent setup
```

## Notes
- The app uses in-memory storage, so data resets when the server restarts.
- This is a good beginner hackathon prototype and keeps the project simple.
- For a real production app, you would later add a database and persistent storage.
