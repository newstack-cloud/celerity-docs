/**
 * Fetches the 3 most recent releases for each Celerity component from GitHub
 * and writes them to src/data/releases.json for use in the documentation.
 *
 * Celerity CLI releases come from the newstack-cloud/celerity repo.
 * The Windows installer comes from the newstack-cloud/bluelink repo
 * (as the Celerity MSI is built alongside Bluelink).
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/data/releases.json');

const GITHUB_API_BASE = 'https://api.github.com';

// Celerity CLI releases come from the celerity repo
const CLI_REPO_OWNER = 'newstack-cloud';
const CLI_REPO_NAME = 'celerity';

// Windows installer comes from the bluelink repo
const INSTALLER_REPO_OWNER = 'newstack-cloud';
const INSTALLER_REPO_NAME = 'bluelink';

// Component configurations with their tag prefixes
const COMPONENTS = {
  'celerity-cli': {
    tagPrefixes: ['apps/cli/v'],
    displayName: 'Celerity CLI',
  },
};

// Platform mappings for display names
const PLATFORM_DISPLAY_NAMES = {
  darwin_amd64: 'macOS (Intel)',
  darwin_arm64: 'macOS (Apple Silicon)',
  linux_amd64: 'Linux (x64)',
  linux_arm64: 'Linux (ARM64)',
  windows_amd64: 'Windows (x64)',
};

/**
 * Fetch all releases from a GitHub repo with pagination
 */
async function fetchAllReleases(owner, repo) {
  const releases = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases?page=${page}&per_page=${perPage}`;
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'celerity-docs-fetch-releases',
    };

    // Use GitHub token if available for higher rate limits
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API error for ${owner}/${repo}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      break;
    }

    releases.push(...data);
    page++;

    // Stop if we've fetched less than a full page (no more results)
    if (data.length < perPage) {
      break;
    }
  }

  return releases;
}

/**
 * Extract version from a release tag
 */
function extractVersion(tag, prefixes) {
  for (const prefix of prefixes) {
    if (tag.startsWith(prefix)) {
      return tag.slice(prefix.length);
    }
  }
  return null;
}

/**
 * Parse asset filename to extract platform info
 * Expected format: {component}_{version}_{os}_{arch}.(tar.gz|zip)
 */
function parseAssetFilename(filename) {
  // Match patterns like: celerity_1.0.0_darwin_amd64.tar.gz
  const match = filename.match(/^(.+?)_(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)_([a-z]+)_([a-z0-9]+)\.(tar\.gz|zip)$/);
  if (match) {
    return {
      component: match[1],
      version: match[2],
      os: match[3],
      arch: match[4],
      extension: match[5],
      platform: `${match[3]}_${match[4]}`,
    };
  }
  return null;
}

/**
 * Process releases for a specific component
 */
function processComponentReleases(allReleases, componentKey, config) {
  const componentReleases = allReleases
    .filter((release) => {
      const version = extractVersion(release.tag_name, config.tagPrefixes);
      return version !== null && !release.draft;
    })
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 3);

  return componentReleases.map((release) => {
    const version = extractVersion(release.tag_name, config.tagPrefixes);
    const assets = {};

    // Find checksums file and signature
    const checksumsAsset = release.assets.find((a) => a.name === 'checksums.txt');
    const checksumsSigAsset = release.assets.find((a) => a.name === 'checksums.txt.sig');

    // Process each asset
    for (const asset of release.assets) {
      const parsed = parseAssetFilename(asset.name);
      if (parsed) {
        // Find corresponding SBOM file
        const sbomFilename = `${asset.name}.sbom.json`;
        const sbomAsset = release.assets.find((a) => a.name === sbomFilename);

        assets[parsed.platform] = {
          url: asset.browser_download_url,
          filename: asset.name,
          size: asset.size,
          displayName: PLATFORM_DISPLAY_NAMES[parsed.platform] || parsed.platform,
          sbomUrl: sbomAsset?.browser_download_url || null,
        };
      }
    }

    return {
      version,
      tag: release.tag_name,
      publishedAt: release.published_at,
      releaseUrl: release.html_url,
      checksumsUrl: checksumsAsset?.browser_download_url || null,
      checksumsSignatureUrl: checksumsSigAsset?.browser_download_url || null,
      assets,
    };
  });
}

/**
 * Fetch Celerity Windows installer from the bluelink repo
 */
async function fetchWindowsInstaller(bluelinkReleases) {
  const installerRelease = bluelinkReleases.find(
    (release) => release.tag_name === 'windows-installer-celerity-latest' && !release.draft
  );

  if (!installerRelease) {
    console.warn('Warning: windows-installer-celerity-latest release not found');
    return null;
  }

  const msiAsset = installerRelease.assets.find((a) => a.name.endsWith('.msi'));
  const checksumAsset = installerRelease.assets.find((a) => a.name.endsWith('.msi.sha256'));

  if (!msiAsset) {
    console.warn('Warning: MSI asset not found in windows-installer-celerity-latest release');
    return null;
  }

  return {
    url: msiAsset.browser_download_url,
    filename: msiAsset.name,
    size: msiAsset.size,
    checksumUrl: checksumAsset?.browser_download_url || null,
    releaseUrl: installerRelease.html_url,
    publishedAt: installerRelease.published_at,
  };
}

async function main() {
  console.log('Fetching releases from GitHub...');

  try {
    // Fetch CLI releases from the celerity repo
    console.log(`Fetching releases from ${CLI_REPO_OWNER}/${CLI_REPO_NAME}...`);
    const celerityReleases = await fetchAllReleases(CLI_REPO_OWNER, CLI_REPO_NAME);
    console.log(`Fetched ${celerityReleases.length} total releases from ${CLI_REPO_NAME}`);

    // Fetch Windows installer from the bluelink repo
    console.log(`Fetching releases from ${INSTALLER_REPO_OWNER}/${INSTALLER_REPO_NAME} for Windows installer...`);
    const bluelinkReleases = await fetchAllReleases(INSTALLER_REPO_OWNER, INSTALLER_REPO_NAME);
    console.log(`Fetched ${bluelinkReleases.length} total releases from ${INSTALLER_REPO_NAME}`);

    const result = {
      generatedAt: new Date().toISOString(),
      windowsInstaller: await fetchWindowsInstaller(bluelinkReleases),
    };

    // Process each component
    for (const [componentKey, config] of Object.entries(COMPONENTS)) {
      console.log(`Processing ${config.displayName}...`);
      result[componentKey] = processComponentReleases(celerityReleases, componentKey, config);
      console.log(`  Found ${result[componentKey].length} releases`);
    }

    // Ensure output directory exists
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

    // Write output
    writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
    console.log(`\nWrote releases data to ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error fetching releases:', error);
    process.exit(1);
  }
}

main();
