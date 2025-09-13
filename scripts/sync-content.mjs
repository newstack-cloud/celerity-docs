import { algoliasearch } from "algoliasearch";
import { sync } from "fumadocs-core/search/algolia";
import * as fs from "node:fs";
import dotenv from "dotenv";
dotenv.config();

// the path of pre-rendered `static.json`.
const filePath = ".next/server/app/static.json.body";

const content = fs.readFileSync(filePath);
const records = JSON.parse(content.toString());
const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_SECRET_API_KEY
);

// update the index settings and sync search indexes
void sync(client, {
  indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME,
  documents: records,
});
