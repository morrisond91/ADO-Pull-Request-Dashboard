const root = document.getElementById('root');


function createApp() {
  let repos = [];
  let selectedRepos = [];
  let prs = [];
  let loading = false;
  let error = '';
  let intervalId = null;
  let repoAccordionOpen = false;
  let completedSummary = [];
  let completedByRepo = [];


  function render() {
    // Completed PR summary section (Contributors by Repository) - styled as cards in a row, below active PRs
    let summaryHtml = '';
    if (completedByRepo.length > 0) {
      summaryHtml = `
        <div class="row g-4 mt-2 mb-4">
          ${completedByRepo.map(repoSummary => `
            <div class="col-12 col-md-6 col-lg-4">
              <div class="card h-100 shadow-sm">
                <div class="card-header purple">
                  <span class="section-title mb-0" style="font-size:1.1rem; border:0; color:#fff;">${repoSummary.repository}</span>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-striped table-hover mb-0 align-middle" style="min-width:300px;">
                      <thead class="table-light">
                        <tr>
                          <th style="min-width:120px;">Contributor</th>
                          <th style="min-width:80px;">Completed PRs</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${repoSummary.contributors.length === 0 ? `<tr><td colspan="2" class="text-muted">No completed PRs</td></tr>` : repoSummary.contributors.map(row => `
                          <tr>
                            <td>${row.contributor}</td>
                            <td><span class="badge bg-success" style="font-size:1rem;">${row.count}</span></td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    root.innerHTML = `
      <div class="container py-4 position-relative">
        <div class="mb-4 d-flex align-items-center justify-content-between">
          <div class="section-title mb-0">Pull Request Insights</div>
          <button class="btn btn-link p-0 ms-2" id="configBtn" title="Configure" style="font-size:2rem;color:#6f42c1;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.693-1.115l.094-.319z"/>
            </svg>
          </button>
        </div>
        <div class="card mb-4">
          <div class="card-header purple">
            <div class="d-flex align-items-center justify-content-between">
              <span class="section-title mb-0" style="font-size:1.25rem; border:0; color:#fff;">Repositories</span>
              <button class="btn btn-purple btn-sm" id="toggleAccordionBtn" type="button">
                ${repoAccordionOpen ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div class="accordion ${repoAccordionOpen ? '' : 'd-none'}" id="repoAccordion">
            <div class="accordion-item border-0">
              <div class="accordion-body pt-3 pb-0">
                <div class="row g-2">
                  ${repos.map(r => `
                    <div class="col-12 col-md-4 col-lg-3">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="repo-${r.name}" ${selectedRepos.includes(r.name) ? 'checked' : ''} />
                        <label class="form-check-label" for="repo-${r.name}">${r.name}</label>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <button class="btn btn-purple mt-3 d-inline-flex align-items-center" id="fetchBtn" ${loading || selectedRepos.length === 0 ? 'disabled' : ''}>
                  <span>Fetch PRs</span>
                  <span id="fetchSpinner" class="ms-2" style="display:none;"><span class="spinner-border spinner-border-sm"></span></span>
                </button>
                ${error ? `<div class="alert alert-danger mt-3">${error}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header purple">
            <span class="section-title mb-0" style="font-size:1.25rem; border:0; color:#fff;">Active Pull Requests</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-striped table-hover mb-0 align-middle" style="min-width:1200px;">
                <thead class="table-light">
                  <tr>
                    <th style="min-width:140px;">Created By</th>
                    <th style="min-width:140px;">Created</th>
                    <th style="min-width:160px;">Repository</th>
                    <th style="min-width:300px;">Title</th>
                    <th style="min-width:120px;">Work Items</th>
                    <th style="min-width:100px;">Status</th>
                    <th style="min-width:180px;">Reviewers</th>
                    <th style="min-width:80px;">Link</th>
                  </tr>
                </thead>
                <tbody>
                  ${loading ? `
                    <tr><td colspan="8" class="text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading pull requests...</td></tr>
                  ` : prs.length === 0 ? `
                    <tr><td colspan="8" class="text-center text-muted">No active pull requests found.</td></tr>
                  ` : prs.map(pr => {
                    // Show 'Draft' if PR is draft, else status
                    const isDraft = pr.isDraft || pr.title?.toLowerCase().startsWith('draft:') || pr.title?.toLowerCase().startsWith('[draft]');
                    const statusLabel = isDraft ? 'Draft' : 'Active';
                    // Work items links
                    let workItemsHtml = '';
                    if (pr.workItems && pr.workItems.length > 0) {
                      workItemsHtml = pr.workItems.map(wi => `<a href="${wi.url}" target="_blank" class="btn btn-sm btn-outline-secondary me-1">#${wi.id}</a>`).join('');
                    }
                    // Format date
                    let createdDate = '';
                    if (pr.createdDate) {
                      const d = new Date(pr.createdDate);
                      createdDate = d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    }
                    return `
                    <tr style="vertical-align:middle;">
                      <td>${pr.createdBy ? pr.createdBy.displayName : ''}</td>
                      <td>${createdDate}</td>
                      <td>${pr.repository}</td>
                      <td style="white-space:normal;word-break:break-word;">${pr.title}</td>
                      <td>${workItemsHtml}</td>
                      <td><span class="badge ${isDraft ? 'bg-secondary' : 'bg-purple'}" style="background-color:#6f42c1;color:#fff;">${statusLabel}</span></td>
                      <td>
                        ${pr.reviewers.map(r => `
                          <div class="mb-1">
                            <span class="badge ${r.hasApproved ? 'bg-success' : r.vote < 0 ? 'bg-danger' : 'bg-warning text-dark'}">
                              ${r.displayName} - ${r.hasApproved ? 'Approved' : r.vote < 0 ? 'Rejected' : 'Waiting'}
                            </span>
                          </div>
                        `).join('')}
                      </td>
                      <td><a href="${pr.webUrl}" target="_blank" class="btn btn-sm btn-purple w-100" style="background-color:#6f42c1;color:#fff;">Open</a></td>
                    </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="my-4">
          <div class="section-title" style="font-size:1.3rem; color:#6f42c1; font-weight:700; letter-spacing:1px; border-bottom:2px solid #e5e5f7; padding-bottom:0.5rem;">Completed Pull Requests by Contributor (per Repository)</div>
        </div>
        ${summaryHtml}
        <!-- Config Modal -->
        <div class="modal fade" id="configModal" tabindex="-1" aria-labelledby="configModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="configModalLabel">Edit Configuration</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="configForm">
                  <div class="mb-3">
                    <label class="form-label">Organization</label>
                    <input type="text" class="form-control" id="orgInput" required />
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Project</label>
                    <input type="text" class="form-control" id="projectInput" required />
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Personal Access Token</label>
                    <input type="password" class="form-control" id="patInput" required />
                  </div>
                  <div class="mb-3 row">
                    <div class="col-md-5">
                      <label class="form-label">Available Repositories</label>
                      <select multiple class="form-select" id="availableRepos" size="8"></select>
                    </div>
                    <div class="col-md-2 d-flex flex-column align-items-center justify-content-center gap-2" style="margin-top:2.5rem;">
                      <button type="button" class="btn btn-outline-secondary" id="moveToDefault">&rarr;</button>
                      <button type="button" class="btn btn-outline-secondary" id="moveToAvailable">&larr;</button>
                    </div>
                    <div class="col-md-5">
                      <label class="form-label">Default Selected Repositories</label>
                      <select multiple class="form-select" id="defaultRepos" size="8"></select>
                    </div>
                  </div>
                  <button type="submit" class="btn btn-purple">Save</button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <footer class="mt-5 text-center">
          <div style="font-size:2rem; font-weight:900; color:#6f42c1; letter-spacing:2px;">BIG DAVY AI SOLUTIONS</div>
        </footer>
      </div>
    `;

    // Show/hide fetch spinner
    const fetchSpinner = document.getElementById('fetchSpinner');
    if (fetchSpinner) {
      fetchSpinner.style.display = loading ? '' : 'none';
    }

    // Config modal logic
    let configModalInstance = null;
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
      configBtn.onclick = () => {
        // Prevent opening modal if still loading repos/config
        if (loading || !repos.length) {
          // Optionally show a toast or alert
          alert('Please wait, repositories and configuration are still loading.');
          return;
        }
        // Fill modal with current config
        fetch('/api/config').then(r => r.json()).then(cfg => {
          document.getElementById('orgInput').value = cfg.azureDevOps.organization;
          document.getElementById('projectInput').value = cfg.azureDevOps.project;
          document.getElementById('patInput').value = cfg.azureDevOps.personalAccessToken || '';
          // Dual list setup
          const allRepoNames = repos.map(r => r.name);
          const defaultRepos = cfg.defaultRepositories || [];
          const availableRepos = allRepoNames.filter(r => !defaultRepos.includes(r));
          const availableSelect = document.getElementById('availableRepos');
          const defaultSelect = document.getElementById('defaultRepos');
          availableSelect.innerHTML = availableRepos.map(r => `<option value="${r}">${r}</option>`).join('');
          defaultSelect.innerHTML = defaultRepos.map(r => `<option value="${r}">${r}</option>`).join('');
        });
        // Show modal (Bootstrap 5)
        configModalInstance = new window.bootstrap.Modal(document.getElementById('configModal'));
        configModalInstance.show();
        // Pause polling
        if (intervalId) clearInterval(intervalId);
      };
    }
    // Modal close: resume polling
    const configModalEl = document.getElementById('configModal');
    if (configModalEl) {
      configModalEl.addEventListener('hidden.bs.modal', () => {
        startPolling();
      });
    }
    // Dual list move logic
    const moveToDefaultBtn = document.getElementById('moveToDefault');
    const moveToAvailableBtn = document.getElementById('moveToAvailable');
    if (moveToDefaultBtn && moveToAvailableBtn) {
      moveToDefaultBtn.onclick = () => {
        const availableSelect = document.getElementById('availableRepos');
        const defaultSelect = document.getElementById('defaultRepos');
        Array.from(availableSelect.selectedOptions).forEach(opt => {
          defaultSelect.appendChild(opt);
        });
      };
      moveToAvailableBtn.onclick = () => {
        const availableSelect = document.getElementById('availableRepos');
        const defaultSelect = document.getElementById('defaultRepos');
        Array.from(defaultSelect.selectedOptions).forEach(opt => {
          availableSelect.appendChild(opt);
        });
      };
    }
    const configForm = document.getElementById('configForm');
    if (configForm) {
      configForm.onsubmit = function(e) {
        e.preventDefault();
        const org = document.getElementById('orgInput').value.trim();
        const project = document.getElementById('projectInput').value.trim();
        const pat = document.getElementById('patInput').value.trim();
        // Get default repos from select
        const defaultRepos = Array.from(document.getElementById('defaultRepos').options).map(opt => opt.value);
        fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            azureDevOps: { organization: org, project, personalAccessToken: pat },
            defaultRepositories: defaultRepos
          })
        }).then(() => {
          // Hide modal and reload config
          if (configModalInstance) configModalInstance.hide();
          fetchReposAndConfig();
        });
      };
    }

    // Accordion toggle
    const toggleBtn = document.getElementById('toggleAccordionBtn');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        repoAccordionOpen = !repoAccordionOpen;
        render();
      };
    }

    // Add event listeners
    repos.forEach(r => {
      const cb = document.getElementById(`repo-${r.name}`);
      if (cb) {
        cb.onchange = () => {
          if (cb.checked) {
            selectedRepos.push(r.name);
          } else {
            selectedRepos = selectedRepos.filter(n => n !== r.name);
          }
          render();
          fetchPRs();
        };
      }
    });
    const fetchBtn = document.getElementById('fetchBtn');
    if (fetchBtn) fetchBtn.onclick = fetchPRs;
  }

  function fetchReposAndConfig() {
    loading = true;
    error = '';
    render();
    Promise.all([
      fetch('/api/repositories').then(r => r.json()),
      fetch('/api/config').then(r => r.json())
    ]).then(([repoList, cfg]) => {
      repos = repoList;
      selectedRepos = cfg.defaultRepositories;
      loading = false;
      render();
      fetchPRs();
      fetchCompletedSummary();
    }).catch(e => {
      error = 'Failed to load repositories/config.';
      loading = false;
      render();
    });
  }

  // Cache completed PRs by repo for 1 day (per repo selection)
  function fetchCompletedSummary() {
    if (!selectedRepos.length) {
      completedByRepo = [];
      render();
      return;
    }
    const cacheKey = 'completedByRepoCache_' + selectedRepos.sort().join(',');
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
    const now = Date.now();
    if (cache.data && cache.timestamp && now - cache.timestamp < 24 * 60 * 60 * 1000) {
      completedByRepo = cache.data;
      render();
      return;
    }
    fetch('/api/completedprs-by-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositories: selectedRepos })
    })
      .then(r => r.json())
      .then(data => {
        completedByRepo = data;
        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: now }));
        render();
      })
      .catch(() => {
        completedByRepo = [];
        render();
      });
  }

  function fetchPRs() {
    if (!selectedRepos.length) {
      prs = [];
      render();
      return;
    }
    loading = true;
    error = '';
    const fetchSpinner = document.getElementById('fetchSpinner');
    if (fetchSpinner) fetchSpinner.style.display = '';
    fetch('/api/pullrequests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositories: selectedRepos })
    })
      .then(r => r.json())
      .then(data => {
        prs = data.map(pr => ({
          ...pr,
          createdBy: pr.createdBy || (pr.raw && pr.raw.createdBy) || null,
          workItems: pr.workItems || []
        }));
        loading = false;
        render();
        fetchCompletedSummary();
      })
      .catch(e => {
        error = 'Failed to load pull requests.';
        loading = false;
        render();
      });
  }

  // Poll every 30 seconds
  function startPolling() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(fetchPRs, 30000);
  }

  fetchReposAndConfig();
  startPolling();
}

createApp();
