#!/usr/bin/env node

// Deletes all releases in the specified GitHub repo. It leaves tags intact.
const owner = "smzelek";
const repo = "action-gh-release-repro";

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN env var is required (needs repo scope).");
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "delete-releases-script",
  };

  const releases = [];
  for (let page = 1; ; page += 1) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100&page=${page}`,
      { headers },
    );
    if (!res.ok) {
      throw new Error(`Failed to list releases (status ${res.status})`);
    }
    const batch = await res.json();
    releases.push(...batch);
    if (batch.length < 100) break;
  }

  if (!releases.length) {
    console.log("No releases found.");
    return;
  }

  console.log(`Deleting ${releases.length} releases...`);
  for (const release of releases) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/${release.id}`,
      { method: "DELETE", headers },
    );
    if (!res.ok) {
      console.error(`Failed to delete release ${release.name || release.tag_name} (id ${release.id}) - status ${res.status}`);
    } else {
      console.log(`Deleted release ${release.name || release.tag_name}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
