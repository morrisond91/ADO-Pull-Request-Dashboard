# Azure DevOps PR Dashboard

A Node.js + React application for monitoring and managing Azure DevOps pull requests across multiple repositories.

## Prerequisites

- **Node.js** (v16 or later recommended)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- An Azure DevOps Personal Access Token (PAT) with appropriate permissions

## Installation

1. **Clone the repository:**
   ```sh
   git clone [https://your-repo-url.git](https://github.com/morrisond91/ADO-Pull-Request-Dashboard)
   cd ADO-Pull-Request-Dashboard
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configuration:**
   - Edit `config.json` in the directory.
   - Set your Azure DevOps `organization`, `project`, and `personalAccessToken`.
   - Optionally, adjust the `defaultRepositories` list.

4. **Start the application:**
   ```sh
   npm start
   ```
   The app will be available at [http://localhost:4000](http://localhost:4000).

## Dependencies

- express
- node-fetch
- bootstrap (served via CDN)
- react (served via CDN)
- (Other dependencies as listed in `package.json`)

## Usage

- Open your browser to [http://localhost:4000](http://localhost:4000).
- Use the gear icon to configure your Azure DevOps settings and repositories.
- The dashboard will auto-refresh pull requests every 30 seconds.
