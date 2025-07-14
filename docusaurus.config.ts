import { config as dotenvConfig } from "dotenv";
import { Config } from "@docusaurus/types";

// @ts-ignore
dotenvConfig({ silent: true });

// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const config: Config = {
  title: "Celerity",
  tagline: "The backend toolkit that gets you moving fast",
  url: "https://celerityframework.io",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "newstack-cloud", // Usually your GitHub org/user name.
  projectName: "celerity", // Usually your repo name.
  trailingSlash: false,
  deploymentBranch: "gh-pages",
  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/newstack-cloud/celerity-docs/tree/main/",
        },
        blog: {
          showReadingTime: true,
          editUrl: "https://github.com/newstack-cloud/celerity-docs/tree/main/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],
  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "celerity-cli",
        path: "cli",
        routeBasePath: "cli",
        sidebarPath: require.resolve("./sidebars-celerity-cli.js"),
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "celerity-one",
        path: "celerity-one",
        routeBasePath: "celerity-one",
        sidebarPath: require.resolve("./sidebars-celerity-one.js"),
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "workflow-runtime",
        path: "workflow-runtime",
        routeBasePath: "workflow-runtime",
        sidebarPath: require.resolve("./sidebars-workflow-runtime.js"),
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "node-runtime",
        path: "node-runtime",
        routeBasePath: "node-runtime",
        sidebarPath: require.resolve("./sidebars-node-runtime.js"),
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "csharp-runtime",
        path: "csharp-runtime",
        routeBasePath: "csharp-runtime",
        sidebarPath: require.resolve("./sidebars-csharp-runtime.js"),
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "python-runtime",
        path: "python-runtime",
        routeBasePath: "python-runtime",
        sidebarPath: require.resolve("./sidebars-python-runtime.js"),
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "java-runtime",
        path: "java-runtime",
        routeBasePath: "java-runtime",
        sidebarPath: require.resolve("./sidebars-java-runtime.js"),
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "go-sdk",
        path: "go-sdk",
        routeBasePath: "go-sdk",
        sidebarPath: require.resolve("./sidebars-go-sdk.js"),
      },
    ],
  ],
  themes: ["docusaurus-theme-openapi-docs"],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Celerity",
        logo: {
          alt: "Celerity",
          src: "img/logo.svg",
          srcDark: "img/logo-dark.svg",
          width: 50,
        },
        items: [
          {
            type: "dropdown",
            label: "Docs",
            position: "right",
            items: [
              {
                label: "Getting Started",
                activeBasePath: "/docs/intro/getting-started",
                to: "docs/intro/getting-started",
              },
              {
                label: "Overview",
                activeBasePath: "/docs/intro/overview",
                to: "docs/intro/overview",
              },
              {
                label: "Runtime",
                activeBasePath: "/docs/runtime",
                to: "docs/runtime/intro",
              },
              {
                label: "Applications",
                activeBasePath: "/docs/applications",
                to: "docs/applications/intro",
              },
            ]
          },
          {
            type: "dropdown",
            label: "Components",
            position: "right",
            items: [
              {
                label: "CLI",
                activeBasePath: "/cli",
                to: "/cli/docs/intro",
              },
              {
                label: "Celerity::1",
                activeBasePath: "/celerity-one",
                to: "/celerity-one/docs/intro",
              },
              {
                label: "Workflow Runtime",
                activeBasePath: "/workflow-runtime",
                to: "/workflow-runtime/docs/intro",
              }
            ],
          },
          {
            type: "dropdown",
            label: "Runtimes & SDKs",
            position: "right",
            items: [
              {
                label: "Node.js",
                activeBasePath: "/node-runtime",
                to: "/node-runtime/docs/intro",
              },
              {
                label: "C#/.NET",
                activeBasePath: "/csharp-runtime",
                to: "/csharp-runtime/docs/intro",
              },
              {
                label: "Python",
                activeBasePath: "/python-runtime",
                to: "/python-runtime/docs/intro",
              },
              {
                label: "Java",
                activeBasePath: "/java-runtime",
                to: "/java-runtime/docs/intro",
              },
              {
                label: "Go",
                activeBasePath: "/go-sdk",
                to: "/go-sdk/docs/intro",
              },
            ],
          },
          {
            href: "https://github.com/newstack-cloud/celerity",
            "aria-label": "GitHub",
            position: "right",
            className: "header-github-link",
          },
          {
            type: "docsVersionDropdown",
            title: "Node.js SDK Version",
            docsPluginId: "node-runtime",
            position: "left",
          },
          {
            type: "docsVersionDropdown",
            title: "C# SDK Version",
            docsPluginId: "csharp-runtime",
            position: "left",
          },
          {
            type: "docsVersionDropdown",
            title: "Python SDK Version",
            docsPluginId: "python-runtime",
            position: "left",
          },
          {
            type: "docsVersionDropdown",
            title: "Java SDK Version",
            docsPluginId: "java-runtime",
            position: "left",
          },
          {
            type: "docsVersionDropdown",
            title: "Go SDK Version",
            docsPluginId: "go-sdk",
            position: "left",
          },
          {
            type: "docsVersionDropdown",
            title: "Celerity CLI Version",
            docsPluginId: "celerity-cli",
            position: "left",
          },
          {
            type: "docsVersionDropdown",
            title: "Celerity::1 Version",
            docsPluginId: "celerity-one",
            position: "left",
          },
          {
            type: "docsVersionDropdown",
            title: "Workflow Runtime Version",
            docsPluginId: "workflow-runtime",
            position: "left",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Getting Started",
                to: "/docs/intro/getting-started",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Stack Overflow",
                href: "https://stackoverflow.com/questions/tagged/celerityframework",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/newstack-cloud/celerity",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} The Celerity documentation authors.`,
      },
      algolia: {
        appId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_SEARCH_API_KEY,
        indexName: process.env.ALGOLIA_INDEX_NAME,
      },
    }),
  customFields: {
    customPluginContent: {
      "celerity-cli": {
        title: "Celerity CLI",
      },
      "node-runtime": {
        title: "Node.js Runtime & SDK",
      },
      "csharp-runtime": {
        title: "C#/.NET Runtime & SDK",
      },
      "python-runtime": {
        title: "Python Runtime & SDK",
      },
      "java-runtime": {
        title: "Java Runtime & SDK",
      },
      "go-sdk": {
        title: "Go SDK",
      },
      "celerity-one": {
        title: "Celerity::1",
      },
      "workflow-runtime": {
        title: "Workflow Runtime",
      },
    },
  },
};

module.exports = config;
