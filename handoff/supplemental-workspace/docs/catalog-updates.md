# Lorefy Weekly Catalog Updates

This package is ready for weekly catalog updates in two layers:

1. The web app loads `modules/lorefy-catalog-updater.js`.
2. Supabase publishes a weekly manifest and delta from `functions/catalog-update`.

## Local Preview

The local app reads:

- `outputs/lorefy-local/uploads/lorefy-catalog-manifest.json`
- `outputs/lorefy-local/uploads/catalog-deltas/latest.json`

The starter delta is empty. Replace `latest.json` with a real delta to test new
works or status changes without rebuilding the full catalog.

## Production Supabase Setup

1. Create a Supabase project.
2. Set secrets:

```bash
supabase secrets set CATALOG_UPDATE_SECRET="long-random-secret"
supabase secrets set LOREFY_BASE_CATALOG_VERSION="20260703-dataclean-v1"
```

3. Apply the migration:

```bash
supabase db push
```

4. Deploy the function:

```bash
supabase functions deploy catalog-update
```

5. Run `supabase/cron/schedule-catalog-update.sql` in the SQL editor after
   replacing `PROJECT_REF` and the placeholder secret values.

6. Point the app config at the function manifest:

```js
window.LOREFY_CATALOG_UPDATES = {
  enabled: true,
  autoCheck: true,
  manifestUrl: "https://PROJECT_REF.functions.supabase.co/catalog-update?kind=manifest",
  checkIntervalMs: 1000 * 60 * 60 * 24 * 7
};
```

## Delta Shape

```json
{
  "schema": 1,
  "version": "2026-W28",
  "upserts": [{ "id": "mal-manga-1-example", "title": "Example", "type": "مانجا" }],
  "patches": [{ "id": "mal-manga-336-gto", "st": "مكتملة" }],
  "removeIds": [],
  "aliases": {}
}
```

`upserts` add new works or replace fields on existing works. `patches` are
merged into existing records by `id`.
