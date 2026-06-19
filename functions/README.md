# Firebase Functions

## Environment variables

`functions/.env` is auto-generated from the root `.env.local` by `yarn sync-env`. Run `yarn dev` or `yarn local` from the repo root and it will be created automatically.

To create it manually:
```bash
cp .env.local functions/.env
```

See the root `README.md` for the full variable reference.
