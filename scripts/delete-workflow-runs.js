#!/usr/bin/env node

// Deletes all workflow runs in the specified GitHub repo.
const owner = "smzelek";
const repo = "action-gh-release-repro";

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN env var is required (needs actions:write scope).");
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "delete-workflow-runs-script",
  };

  const runs = [];
  for (let page = 1; ; page += 1) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=100&page=${page}`,
      { headers },
    );
    if (!res.ok) {
      throw new Error(`Failed to list workflow runs (status ${res.status})`);
    }
    const data = await res.json();
    runs.push(...(data.workflow_runs || []));
    if (!data.workflow_runs || data.workflow_runs.length < 100) break;
  }

  if (!runs.length) {
    console.log("No workflow runs found.");
    return;
  }

  console.log(`Deleting ${runs.length} workflow runs...`);
  for (const run of runs) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}`,
      { method: "DELETE", headers },
    );
    if (!res.ok) {
      console.error(`Failed to delete run ${run.id} (${run.name || run.display_title}) - status ${res.status}`);
    } else {
      console.log(`Deleted run ${run.id} (${run.name || run.display_title})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
