# LootFactory

This is a full-stack React + Express application that automatically scrapes deals from a Telegram channel and displays them on a modern, fast website.

## Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/) (optional, but recommended)

## Getting Started

Follow these steps to run the project locally on your machine using VS Code:

### 1. Extract the Files
Make sure you have fully extracted the downloaded ZIP file into a regular folder. Do not try to open the files directly from inside the ZIP archive.

### 2. Open in VS Code
Open Visual Studio Code, go to **File > Open Folder...**, and select the extracted `LootFactory` folder.

### 3. Install Dependencies
When you download the project, the `node_modules` folder (which contains all the required libraries) is not included to save space. You need to install them:
1. Open the integrated terminal in VS Code by pressing `` Ctrl + ` `` (or go to **Terminal > New Terminal**).
2. Run the following command:
   ```bash
   npm install
   ```
   *Wait for the installation to finish.*

### 4. Set Up Environment Variables
1. In the VS Code file explorer, find the file named `.env.example`.
2. Rename it to `.env` (or copy its contents into a new file named `.env`).
3. Open the `.env` file and set your Telegram channel username:
   ```env
   VITE_TELEGRAM_CHANNEL=FlashLootDealsx
   ```

### 5. Start the Development Server
In the same VS Code terminal, run:
```bash
npm run dev
```

### 6. View the Site
Once the server starts, it will show a local URL in the terminal (usually `http://localhost:3000`). 
Hold `Ctrl` (or `Cmd` on Mac) and click the link to open it in your browser!

## Troubleshooting
- **"npm is not recognized"**: You need to install Node.js and restart your computer.
- **SQLite Errors**: The project uses `better-sqlite3`. If you get errors during `npm install`, you might need to install Python and Visual Studio Build Tools (on Windows) so it can compile the database driver.
