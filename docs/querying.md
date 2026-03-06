# Querying Sanity content

This wiki covers how to query content from the Sanity API — both using raw GROQ in any context (e.g. Sanity Vision, the CLI, or custom scripts) and using the patterns established in the Astro site (`leve-astro`).

---

## Table of contents

1. [GROQ primer](#groq-primer)
2. [Datasets](#datasets)
3. [Schema reference & example queries](#schema-reference--example-queries)
   - [product](#product)
   - [opening-hours](#opening-hours)
   - [faq](#faq)
   - [orderTerms](#orderterms)
   - [order](#order)
4. [Querying from the Astro site](#querying-from-the-astro-site)
   - [Setup & configuration](#setup--configuration)
   - [The `SanityAPI` class](#the-sanityapi-class)
   - [Astro Content Collections](#astro-content-collections)
   - [Writing a new query](#writing-a-new-query)
5. [Images](#images)
6. [Portable Text](#portable-text)

---

## GROQ primer

[GROQ](https://www.sanity.io/docs/groq) (Graph-Relational Object Queries) is Sanity's query language. A typical query looks like:

```
*[_type == "product"]
```

| Syntax | Meaning |
|---|---|
| `*` | All documents |
| `[_type == "foo"]` | Filter by document type |
| `{field1, field2}` | Projection — select specific fields |
| `\| order(field asc)` | Sort results |
| `[0]` | Return first result only |
| `[0...10]` | Slice (first 10 results) |
| `$param` | Named parameter (passed alongside the query) |
| `->` | Dereference a reference |
| `'alias': expression` | Rename a field in the result |

You can try any query interactively in **Sanity Vision** — open the studio, click the beaker icon in the sidebar, and run queries against either dataset.

---

## Datasets

The project (`mz20cm4o`) has two datasets:

| Dataset | Purpose | Studio workspace |
|---|---|---|
| `production` | Live site data | `/production` |
| `preview` | Staging / test data | `/staging` |

When querying via the API, the dataset is selected at the client level (see [Setup & configuration](#setup--configuration)), not in the GROQ query itself.

---

## Schema reference & example queries

### `product`

Represents a bakery product available in the shop.

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Product name |
| `slug.current` | `string` | URL-safe identifier |
| `variants[]` | array of objects | One or more price options |
| `variants[].description` | `string` | e.g. `"Standard"` |
| `variants[].price` | `number` | Price in SEK |
| `variants[].id.current` | `string` | Unique slug per variant |
| `images[]` | array of image assets | First image is used as the primary |
| `images[].alt` | `string` | Alt text for accessibility |
| `content` | Portable Text array | Rich product description |
| `maxQuantityPerOrder` | `number \| null` | `null` = unlimited, `0` = sold out |
| `pickupDates[]` | array of date strings | If set, restricts pickup to these dates |

**Fetch all products (full projection):**
```groq
*[_type == "product"] {
  'id': slug.current,
  title,
  content,
  images,
  maxQuantityPerOrder,
  pickupDates,
  variants[] {
    "id": id.current,
    price,
    description
  }
}
```

**Fetch a single product by slug:**
```groq
*[_type == "product" && slug.current == $slug][0] {
  'id': slug.current,
  title,
  content,
  images,
  variants[] {
    "id": id.current,
    price,
    description
  }
}
```
Pass `{ slug: "sourdough-loaf" }` as the query parameters.

**Fetch only available products (not sold out):**
```groq
*[_type == "product" && maxQuantityPerOrder != 0] {
  'id': slug.current,
  title,
  variants[] { "id": id.current, price, description }
}
```

---

### `opening-hours`

Stores one or more named sets of opening hours. The live site uses the set with `setId.current == "default"`.

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Display name of this hours set |
| `setId.current` | `string` | Machine-readable identifier |
| `days.mon` … `days.sun` | object | Regular hours per weekday |
| `days.*.day` | `number` | JS weekday index (0 = Sunday … 6 = Saturday) |
| `days.*.time` | `string \| null` | Human-readable range, e.g. `"11-18"` |
| `days.*.closed` | `boolean` | `true` if closed this weekday |
| `irregular[]` | array of objects | Override hours for specific dates |
| `irregular[].date` | `string` | ISO date, e.g. `"2025-12-24"` |
| `irregular[].time` | `string \| null` | Hours for this date |
| `irregular[].closed` | `boolean` | `true` if closed on this date |
| `irregular[].name` | `string \| null` | Reason label, e.g. `"Julafton"` |

**Fetch the default hours set:**
```groq
*[_type == "opening-hours" && setId.current == "default"][0] {
  title,
  days,
  irregular
}
```

**Fetch all hours sets (e.g. if you need to list several):**
```groq
*[_type == "opening-hours"] {
  title,
  "id": setId.current,
  days,
  irregular
}
```

---

### `faq`

Frequently asked questions. Each document is a single Q&A pair.

| Field | Type | Notes |
|---|---|---|
| `question` | `string` | The question |
| `answer` | Portable Text array | Rich-text answer |

**Fetch all FAQ entries:**
```groq
*[_type == "faq"] {
  question,
  answer
}
```

The `answer` field is Portable Text — see [Portable Text](#portable-text) for rendering guidance.

---

### `orderTerms`

Terms and conditions shown during checkout. Multiple documents, each representing one section.

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Section heading |
| `content` | Portable Text array | Body text |
| `sortOrder` | `number` | Controls display order |

**Fetch all terms in order:**
```groq
*[_type == "orderTerms"] {
  title,
  content,
  sortOrder
} | order(sortOrder asc)
```

---

### `order`

Customer orders created by the Astro site during checkout. These are write-heavy documents; you will rarely query them on the front end, but they can be useful for admin tooling.

| Field | Type | Notes |
|---|---|---|
| `orderNumber` | `string` | Format: `YYMMDD-XXXX` |
| `customer.name` | `string` | |
| `customer.email` | `string` | |
| `customer.phone` | `string` | |
| `customer.message` | `string` | Optional note from the customer |
| `pickupDate` | `string` | ISO date |
| `items[]` | array of `orderItem` objects | Line items (snapshot at purchase time) |
| `items[].productTitle` | `string` | Product name at time of purchase |
| `items[].variantId` | `string` | Variant slug at time of purchase |
| `items[].variantDescription` | `string` | e.g. `"Standard"` |
| `items[].unitPrice` | `number` | SEK |
| `items[].quantity` | `number` | |
| `items[].lineTotal` | `number` | SEK |
| `totals.tax` | `number` | SEK |
| `totals.total` | `number` | SEK |

**Fetch a single order by order number:**
```groq
*[_type == "order" && orderNumber == $orderNumber][0] {
  orderNumber,
  customer,
  pickupDate,
  items[] {
    productTitle,
    variantId,
    variantDescription,
    unitPrice,
    quantity,
    lineTotal
  },
  totals
}
```

**Fetch all orders for a given pickup date:**
```groq
*[_type == "order" && pickupDate == $date] | order(orderNumber asc) {
  orderNumber,
  customer { name, phone },
  pickupDate,
  items[] { productTitle, variantDescription, quantity },
  totals
}
```

---

## Querying from the Astro site

### Setup & configuration

The Astro site uses the official [`@sanity/astro`](https://www.npmjs.com/package/@sanity/astro) integration, configured in `astro.config.mjs`:

```leve-astro/astro.config.mjs#L23-L31
sanity({
  projectId: "mz20cm4o",
  dataset: SANITY_DATASET,
  apiVersion: "2026-02-19",
  useCdn: false,
  token: SANITY_TOKEN,
}),
```

Two environment variables control the connection:

| Variable | Required | Description |
|---|---|---|
| `SANITY_TOKEN` | Yes | API token with at least read access |
| `SANITY_DATASET` | No | Defaults to `"production"`; set to `"preview"` for staging |

These are read from `.env` (local) or the Netlify environment (CI/production).

The integration exposes a pre-configured client via the virtual module `sanity:client`. This client is used to create the shared `sanityAPI` singleton in `src/lib/sanityAPI.ts`.

---

### The `SanityAPI` class

`src/lib/api/SanityAPI.ts` wraps the raw Sanity client and provides typed, validated methods. Every method uses [Zod](https://zod.dev/) schemas (from `src/lib/schemas/`) to validate the response at runtime.

| Method | Returns | Description |
|---|---|---|
| `getOrderTerms()` | `OrderTerms` | All order terms, sorted by `sortOrder` |
| `getFaq()` | `Faq` | All FAQ entries |
| `getOpeningHours()` | `OpeningHours` | The `"default"` hours set, with past irregular dates filtered out |
| `getOpenDaysInRange(start, end)` | `string[]` | ISO date strings for open days within the range |
| `query(groqString)` | `unknown` | Raw escape hatch for ad-hoc queries |
| `createOrder(snapshot)` | Sanity document | Writes a new `order` document |
| `getOrderByOrderNumber(n)` | order object or `null` | Fetches a single order |
| `getAsset(filename)` | `string` | Constructs a CDN URL for a file asset |

**Usage in an Astro page or component:**
```leve-astro/src/lib/sanityAPI.ts#L1-L7
import { sanityAPI } from "@lib/sanityAPI";

const faq = await sanityAPI.getFaq();
const openingHours = await sanityAPI.getOpeningHours();
const terms = await sanityAPI.getOrderTerms();
```

**Running a one-off query** (for data not covered by the typed methods):
```leve-astro/src/lib/api/SanityAPI.ts#L1-L3
import { sanityAPI } from "@lib/sanityAPI";
import groq from "groq";

const data = await sanityAPI.query(
  groq`*[_type == "faq"] { question, answer }`
);
```

Using the `groq` template-tag (from the `groq` npm package) is recommended because it enables syntax highlighting and editor tooling.

---

### Astro Content Collections

Products are loaded via Astro's [Content Collections API](https://docs.astro.build/en/guides/content-collections/) in `src/content/config.ts`. This runs at build time (and on-demand in SSR mode) and makes products available through Astro's typed `getCollection` / `getEntry` helpers.

The loader query:
```leve-astro/src/content/config.ts#L12-L28
const json = await sanityAPI.query(
  groq`*[_type == "product"] {
    'id': slug.current,
    maxQuantityPerOrder,
    title,
    content,
    images,
    variants[]{
      "id": id.current,
      price,
      description
    },
    pickupDates
  }`
);
```

Consuming the collection in a page:
```leve-astro/src/content/config.ts#L1-L3
import { getCollection, getEntry } from "astro:content";

// All products
const products = await getCollection("products");

// Single product by slug
const product = await getEntry("products", "sourdough-loaf");
```

Each entry is validated against `ProductSchema` (Zod), so `product.data` is fully typed.

---

### Writing a new query

Follow this pattern to add a new typed query to `SanityAPI`:

1. **Define a Zod schema** in `src/lib/schemas/`, e.g. `MyThingSchema.ts`:

```leve-astro/src/lib/schemas/OrderTermsSchema.ts#L1-L8
import { z } from "astro/zod";

export const MyThingSchema = z.array(
  z.object({
    title: z.string(),
    body: z.array(z.any()), // Portable Text
  })
);

export type MyThing = z.infer<typeof MyThingSchema>;
```

2. **Add a method** to `SanityAPI`:

```leve-astro/src/lib/api/SanityAPI.ts#L1-L8
public async getMyThings(): Promise<MyThing> {
  const json = await this.client.fetch(
    `*[_type == "myThing"] { title, body } | order(_createdAt asc)`
  );
  return MyThingSchema.parse(json);
}
```

3. **Call the method** from your page or component:

```leve-astro/src/lib/sanityAPI.ts#L1-L2
import { sanityAPI } from "@lib/sanityAPI";
const things = await sanityAPI.getMyThings();
```

---

## Images

Product images are stored in Sanity's asset pipeline. The `leve-astro` site uses `@sanity/image-url` to build responsive CDN URLs.

The helper is exported from `src/lib/sanityAPI.ts`:

```leve-astro/src/lib/sanityAPI.ts#L9-L17
import { urlFor } from "@lib/sanityAPI";

// Basic URL
const src = urlFor(image).url();

// Resized & auto-formatted
const src = urlFor(image).width(800).auto("format").url();

// With hotspot cropping
const src = urlFor(image).width(600).height(400).fit("crop").url();
```

The `image` value passed to `urlFor` is the raw Sanity image object from the query result (it must contain an `asset._ref` field).

All images are served from `cdn.sanity.io`, which is allow-listed in `astro.config.mjs` under `image.domains`.

---

## Portable Text

Several fields (`product.content`, `faq.answer`, `orderTerms.content`) use Sanity's [Portable Text](https://portabletext.org/) format — a structured array of block objects.

To render Portable Text in an Astro component, use the [`astro-portabletext`](https://github.com/portabletext/astro-portabletext) package (or any compatible renderer):

```leve-astro/src/lib/schemas/FAQSchema.ts#L1-L3
import { PortableText } from "astro-portabletext";

<PortableText value={entry.answer} />
```

The `product.content` field includes custom marks (`link` and `button`) with extra fields (`url`, `primary`). You will need to pass custom component overrides to handle those:

```leve-astro/src/lib/schemas/Product.ts#L1-L3
<PortableText
  value={product.content}
  components={{
    marks: {
      link: LinkMark,    // renders <a href={value.url}>
      button: ButtonMark // renders a <Button> component
    }
  }}
/>
```
