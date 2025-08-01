
import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Load config
let config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

function getAuthHeader() {
  const pat = config.azureDevOps.personalAccessToken;
  return {
    Authorization: 'Basic ' + Buffer.from(':' + pat).toString('base64'),
  };
}

// API: Get completed PR counts per creator for each selected repository
app.post('/api/completedprs-by-repo', async (req, res) => {
  const { repositories } = req.body;
  const { organization, project } = config.azureDevOps;
  try {
    const repoSummaries = [];
    for (const repo of repositories) {
      const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${encodeURIComponent(repo)}/pullrequests?searchCriteria.status=completed&$top=100&api-version=7.0`;
      const prRes = await axios.get(url, { headers: getAuthHeader() });
      const counts = {};
      if (Array.isArray(prRes.data.value)) {
        prRes.data.value.forEach(pr => {
          const name = pr.createdBy && (pr.createdBy.displayName || pr.createdBy.uniqueName || pr.createdBy.id);
          if (name) {
            counts[name] = (counts[name] || 0) + 1;
          }
        });
      }
      repoSummaries.push({
        repository: repo,
        contributors: Object.entries(counts).map(([contributor, count]) => ({ contributor, count })).sort((a, b) => b.count - a.count)
      });
    }
    res.json(repoSummaries);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch completed PRs by repo' });
  }
});

// API: Get all repositories in the project
app.get('/api/repositories', async (req, res) => {
  try {
    const { organization, project } = config.azureDevOps;
    const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories?api-version=7.0`;
    const response = await axios.get(url, { headers: getAuthHeader() });
    res.json(response.data.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get active pull requests for selected repositories
app.post('/api/pullrequests', async (req, res) => {
  const { repositories } = req.body;
  const { organization, project } = config.azureDevOps;
  try {
    const results = [];
    for (const repo of repositories) {
      const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${encodeURIComponent(repo)}/pullrequests?searchCriteria.status=active&api-version=7.0`;
      const prRes = await axios.get(url, { headers: getAuthHeader() });
      for (const pr of prRes.data.value) {
        // Fallback for webUrl if not present
        let webUrl = pr._links && pr._links.web && pr._links.web.href;
        if (!webUrl) {
          // Construct a web URL if missing
          webUrl = `https://dev.azure.com/${organization}/${project}/_git/${encodeURIComponent(repo)}/pullrequest/${pr.pullRequestId}`;
        }
        // Collect work item links
        let workItems = [];
        if (pr._links && pr._links.workItems && Array.isArray(pr._links.workItems)) {
          workItems = pr._links.workItems.map(wi => {
            // Azure DevOps work item URL is in wi.href, extract id from URL
            const url = wi.href;
            const idMatch = url.match(/workitems\/(\d+)/i);
            return {
              id: idMatch ? idMatch[1] : '',
              url
            };
          });
        }
        results.push({
          repository: repo,
          prId: pr.pullRequestId,
          title: pr.title,
          status: pr.status,
          url: pr.url,
          webUrl,
          createdDate: pr.creationDate,
          reviewers: pr.reviewers.map(r => ({
            displayName: r.displayName,
            vote: r.vote,
            isRequired: r.isRequired,
            hasApproved: r.vote > 0,
            id: r.id
          })),
          createdBy: pr.createdBy ? { displayName: pr.createdBy.displayName, uniqueName: pr.createdBy.uniqueName } : null,
          workItems
        });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get completed pull requests for contributors summary
app.post('/api/completedprs', async (req, res) => {
  const { repositories } = req.body;
  const { organization, project } = config.azureDevOps;
  try {
    const allPRs = [];
    for (const repo of repositories) {
      const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${encodeURIComponent(repo)}/pullrequests?searchCriteria.status=completed&$top=100&api-version=7.0`;
      const prRes = await axios.get(url, { headers: getAuthHeader() });
      if (Array.isArray(prRes.data.value)) {
        allPRs.push(...prRes.data.value.map(pr => ({
          reviewers: pr.reviewers || [],
          repository: repo,
          title: pr.title,
          createdBy: pr.createdBy,
          closedDate: pr.closedDate
        })));
      }
    }
    res.json(allPRs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch completed PRs' });
  }
});

// API: Get config (for frontend)
app.get('/api/config', (req, res) => {
  res.json({
    defaultRepositories: config.defaultRepositories,
    azureDevOps: {
      organization: config.azureDevOps.organization,
      project: config.azureDevOps.project,
      personalAccessToken: config.azureDevOps.personalAccessToken
    }
  });
});

// API: Update config (from frontend)
app.post('/api/config', (req, res) => {
  // Merge new config
  config = { ...config, ...req.body };
  // Write to file
  fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2));
  res.json({ success: true });
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 4000;
app.listen(PORT, () => console.log(`running on http://localhost:${PORT}`));
