# leve-sanity

Sanity Studio for [Bageri Leve](https://bagerileve.se).

The studio is hosted at [leve.sanity.studio](https://leve.sanity.studio) and manages content for the bakery's website. It is configured with two workspaces:

| Workspace | Dataset | Base path |
|-----------|---------|-----------|
| Bageri Leve | `production` | `/production` |
| [TEST] Bageri Leve | `preview` | `/staging` |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Querying content](docs/querying.md) | GROQ primer, schema reference, and how to query from the Astro site |

---

## Prerequisites

- [Node.js](https://nodejs.org/) `v24.14.0` (see `.node-version`)
- A Sanity account with access to project `mz20cm4o`

---

## Getting started

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

The studio will be available at `http://localhost:3333`.

---

## Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the local development server |
| `npm run build` | Build the studio for production |
| `npm run deploy` | Deploy the studio to Sanity's hosted infrastructure |
| `npm run deploy-graphql` | Deploy the GraphQL API |

---

## Schemas

Content types defined in `schemas/`:

| Schema | Description |
|--------|-------------|
| `page` | Generic content pages |
| `product` | Bakery products |
| `order` | Customer orders |
| `orderItem` | Individual line items within an order |
| `orderTerms` | Terms and conditions for orders |
| `opening-hours` | Bakery opening hours |
| `faq` | Frequently asked questions |

---

## Continuous Deployment

The studio is automatically deployed via the GitHub Actions workflow defined in [`.github/workflows/cd.yml`](.github/workflows/cd.yml).

### Trigger

The workflow runs on:
- Every push to the `main` branch
- Manual dispatch via the GitHub Actions UI (`workflow_dispatch`)

### Steps

1. **Checkout** — checks out the repository using `actions/checkout@v4`.
2. **Setup Node.js** — installs the Node.js version specified in `.node-version` and restores the `npm` cache.
3. **Install dependencies** — runs `npm install`.
4. **Deploy Studio** — runs `npx sanity deploy`, which builds and uploads the studio to Sanity's hosting at `leve.sanity.studio`.

### Required secrets

| Secret | Description |
|--------|-------------|
| `SANITY_DEPLOY_TOKEN` | A Sanity API token with deploy permissions. Set this in the repository's **Settings → Secrets and variables → Actions**. |
