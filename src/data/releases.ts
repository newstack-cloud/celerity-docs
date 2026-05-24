/**
 * Type definitions for release data fetched from GitHub
 */

export interface PlatformAsset {
  url: string;
  filename: string;
  size: number;
  displayName: string;
  sbomUrl: string | null;
}

export interface ComponentRelease {
  version: string;
  tag: string;
  publishedAt: string;
  releaseUrl: string;
  checksumsUrl: string | null;
  checksumsSignatureUrl: string | null;
  assets: {
    darwin_amd64?: PlatformAsset;
    darwin_arm64?: PlatformAsset;
    linux_amd64?: PlatformAsset;
    linux_arm64?: PlatformAsset;
    windows_amd64?: PlatformAsset;
  };
}

export interface WindowsInstaller {
  url: string;
  filename: string;
  size: number;
  checksumUrl: string | null;
  releaseUrl: string;
  publishedAt: string;
}

export interface ReleasesData {
  generatedAt: string;
  windowsInstaller: WindowsInstaller | null;
  'celerity-cli': ComponentRelease[];
}

export type ComponentKey = 'celerity-cli';

export const COMPONENT_DISPLAY_NAMES: Record<ComponentKey, string> = {
  'celerity-cli': 'Celerity CLI',
};

// Import the generated releases data
// This file is generated at build time by scripts/fetch-releases.mjs
import releasesJson from './releases.json';

const releasesData = releasesJson as ReleasesData;

export function getReleases(): ReleasesData {
  return releasesData;
}

export function getComponentReleases(component: ComponentKey): ComponentRelease[] {
  return releasesData[component] ?? [];
}

export function getWindowsInstaller(): WindowsInstaller | null {
  return releasesData?.windowsInstaller ?? null;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
