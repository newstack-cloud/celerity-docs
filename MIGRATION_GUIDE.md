# Celerity Resource Documentation Migration Guide

This guide provides step-by-step instructions for migrating Celerity resource type documentation to match the consistent format established in `celerity-api.mdx` and `celerity-consumer.mdx`.

## Overview

The migration standardizes documentation across all Celerity resource types by:

- Converting admonition syntax to Fumadocs Callout components
- Replacing manual field headings with reusable MDX components
- Standardizing link formatting in "Linked From" and "Links To" sections
- Ensuring consistent heading structure and formatting

## Migration Steps

### 1. Convert Admonition Syntax to Callout Components

**Before:**

```markdown
:::warning Optional Title
Content here
:::
```

**After:**

```jsx
<Callout title="Optional Title" type="warning">
  Content here
</Callout>
```

**Rules:**

- If no title is provided in the original admonition, use the admonition type with first letter capitalized as the title
- `:::warning` → `<Callout title="Warning" type="warning">`
- `:::info` → `<Callout title="Info" type="info">`
- `:::note` → `<Callout title="Note" type="info">`
- `:::error` → `<Callout title="Error" type="error">`

**Search Pattern:**

```bash
grep -r "^:::" content/docs/
```

### 2. Replace Field Section Headings

**Before:**

```markdown
#### FIELDS

---
```

**After:**

```jsx
<FieldsHeading />
```

**Search Pattern:**

```bash
grep -r "#### FIELDS" content/docs/
```

### 3. Replace Manual Field Headings with FieldHeading Component

**Before:**

```markdown
<p style={{fontSize: '1.2em'}}><strong>fieldName</strong></p>
```

**After:**

```jsx
<FieldHeading fieldName="fieldName" />
```

**Rules:**

- Preserve exact field names including required indicators: `(required)`, `(conditionally required)`
- Handle duplicate field names by using more context in the replacement
- Use `replace_all: true` for fields that appear multiple times

**Search Pattern:**

```bash
grep -r "<p.*><strong>.*</strong></p>" content/docs/
```

### 4. Standardize "Linked From" and "Links To" Sections

**Before:**

```markdown
#### [`celerity/resource-type`](/docs/path/to/resource)

Description of the relationship...

✅ **Available in v0**
```

**After:**

```markdown
### `celerity/resource-type`

Description of the relationship...

✅ **Available in v0**

[Read more about Celerity resource-type](/docs/framework/applications/resources/celerity-resource-type)
```

**Rules:**

- Remove links from headings (use plain text with backticks)
- Add separate "Read more about..." links after the description
- Use consistent link paths: `/docs/framework/applications/resources/celerity-resource-type`
- Maintain feature availability indicators (✅, 🚀, etc.)

**Search Pattern:**

```bash
grep -r "#### \[.*\]" content/docs/
```

### 5. Fix Internal Link Paths

**Before:**

```markdown
[app deploy configuration](/cli/docs/app-deploy-configuration)
```

**After:**

```markdown
[app deploy configuration](/docs/cli/app-deploy-configuration)
```

**Rules:**

- Remove leading `/cli/` from internal documentation links
- Ensure all internal links use `/docs/` prefix
- Update relative paths to be consistent

**Search Pattern:**

```bash
grep -r "/cli/docs/" content/docs/
```

### 6. Fix Application Resource Link Paths

**Before:**

```markdown
[Read more about Celerity APIs](/docs/applications/resources/celerity-api)
```

**After:**

```markdown
[Read more about Celerity APIs](/docs/framework/applications/resources/celerity-api)
```

**Rules:**

- Change `/docs/applications/` to `/docs/framework/applications/`

**Search Pattern:**

```bash
grep -r "/docs/applications/" content/docs/
```

### 7. Fix Resource Type Link Endings

**Before:**

```markdown
[Read more about Celerity APIs](/docs/framework/applications/resources/celerity-api/current)
[Read more about Celerity workflows](/docs/framework/applications/resources/celerity-workflow/future)
```

**After:**

```markdown
[Read more about Celerity APIs](/docs/framework/applications/resources/celerity-api)
[Read more about Celerity workflows](/docs/framework/applications/resources/celerity-workflow)
```

**Rules:**

- Remove `/current` and `/future` endings from resource type links
- Change `/resources/{resourceType}/(current|future)` to `/resources/{resourceType}`

**Search Pattern:**

```bash
grep -r "/resources/.*/(current|future)" content/docs/
```

### 8. Fix Deploy Configuration Link Paths

**Before:**

```markdown
[deploy configuration](/docs/cli/deploy-configuration)
```

**After:**

```markdown
[deploy configuration](/docs/cli/app-deploy-configuration)
```

**Rules:**

- Change `/deploy-configuration` to `/app-deploy-configuration` in **internal** CLI documentation links only
- **Do not** change external links (e.g., `https://bluelink.dev/cli/docs/deploy-configuration`)
- Only apply to internal documentation links within the `/docs/` path structure

**Search Pattern:**

```bash
grep -r "/docs/cli/deploy-configuration" content/docs/
```

## Migration Checklist

For each resource type document, verify:

- [ ] All `:::` admonitions converted to `<Callout>` components
- [ ] All `#### FIELDS` sections replaced with `<FieldsHeading />`
- [ ] All manual field headings replaced with `<FieldHeading fieldName="..." />`
- [ ] "Linked From" section uses clean headings with separate links
- [ ] "Links To" section uses clean headings with separate links
- [ ] Internal links use consistent `/docs/` paths
- [ ] Application resource links use `/docs/framework/applications/` prefix
- [ ] Resource type links remove `/current` and `/future` endings
- [ ] Internal deploy configuration links use `/app-deploy-configuration` ending (external links unchanged)
- [ ] No linting errors introduced
- [ ] All field names preserved exactly (including required indicators)
- [ ] Feature availability indicators maintained
- [ ] Callout titles follow naming convention

## File-Specific Migration Commands

### Find Files Needing Migration

```bash
# Find files with admonitions
grep -r "^:::" content/docs/ --include="*.mdx" -l

# Find files with manual field headings
grep -r "#### FIELDS" content/docs/ --include="*.mdx" -l

# Find files with embedded links in headings
grep -r "#### \[.*\]" content/docs/ --include="*.mdx" -l
```

### Batch Operations

```bash
# Convert all admonitions (be careful with this - review each file)
find content/docs -name "*.mdx" -exec sed -i 's/^:::warning$/<Callout type="warning">/g' {} \;
find content/docs -name "*.mdx" -exec sed -i 's/^:::info$/<Callout type="info">/g' {} \;
find content/docs -name "*.mdx" -exec sed -i 's/^:::$/<\/Callout>/g' {} \;

# Replace FIELDS headings
find content/docs -name "*.mdx" -exec sed -i 's/#### FIELDS/<FieldsHeading \/>/g' {} \;
```

## Quality Assurance

After migration:

1. **Build Check:** Run `yarn build` to ensure no syntax errors
2. **Linting:** Run `yarn lint` to check for code quality issues
3. **Visual Review:** Check rendered output for proper formatting
4. **Link Validation:** Verify all internal and external links work
5. **Consistency Check:** Compare with `celerity-api.mdx` for format consistency

## Common Pitfalls

1. **Duplicate Field Names:** Some fields appear multiple times - use context to replace correctly
2. **Mixed Admonition Types:** Ensure correct `type` attribute for each Callout
3. **Link Path Inconsistency:** Double-check internal link paths are updated (external links should remain unchanged)
4. **Missing Titles:** Add appropriate titles to Callout components
5. **Preserved Content:** Ensure all original content is preserved during conversion

## Reference Files

- **Target Format:** `content/docs/framework/applications/resources/celerity-api.mdx`
- **Migrated Example:** `content/docs/framework/applications/resources/celerity-consumer.mdx`
- **Component Definitions:** `src/mdx-components.tsx`

## Migration Order Recommendation

1. Start with simpler resource types (fewer fields, fewer links)
2. Test migration process on one file before batch processing
3. Migrate resource types that are referenced by others first
4. Save complex resource types (like `celerity-api.mdx`) for last

This guide ensures consistent, maintainable, and well-formatted documentation across all Celerity resource types.
