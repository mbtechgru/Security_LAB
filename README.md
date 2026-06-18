# AWS Pentest Lab (Terraform)

This Terraform project deploys an isolated pentesting lab that mirrors the CloudFormation version:
- VPC with attacker (public), victim (private), and services (private) subnets
- Kali (t2.micro) with public IP
- Metasploitable 2 (t2.micro) private
- Windows Server (t2.micro) auto-promoted to AD DS (domain default `lab.local`)
- OWASP Juice Shop on AL2023 (Docker) in services subnet (port 3000) reachable from Kali only
- Public read/write S3 bucket (FOR LAB ONLY)
- Intentionally over-permissive IAM role for cloud-esc practice

## Usage (CLI)
1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your own values (key pair, AMI IDs, DSRM password, admin CIDR, etc.). `terraform.tfvars` is gitignored — never commit it.
2. `terraform init`
3. `terraform apply`
4. On success, note the outputs (Kali public IP, bucket name, etc.).
5. Destroy with `terraform destroy` when done.

> ⚠️ **Safety**: Use in your own AWS account only. The environment is intentionally insecure.

## Web Dashboard (secure-orbit-deploy)

[`secure-orbit-deploy/`](secure-orbit-deploy/) is a React/Base44 dashboard ("SecLab Orchestrator") for managing deployments of this same lab through a UI instead of the CLI. It's a Base44 project, so the app itself is edited/published from [Base44.com](http://base44.com); this checkout is the local copy of its generated code.

### Running it locally
1. `cd secure-orbit-deploy && npm install`
2. Create `.env.local` with:
   ```
   VITE_BASE44_APP_ID=your_app_id
   VITE_BASE44_APP_BASE_URL=your_backend_url
   ```
3. `npm run dev`
4. Push changes to this repo to have them reflected in the Base44 Builder; publish from [Base44.com](http://base44.com) when ready.

Docs: https://docs.base44.com/Integrations/Using-GitHub · Support: https://app.base44.com/support

### Terraform Cloud integration

The Deployments page (`secure-orbit-deploy/src/pages/Deployments.jsx`) drives real Terraform Cloud runs against this repo's `main.tf` / `variables.tf` / `outputs.tf` instead of simulating output:

- One Terraform Cloud workspace is created per deployment, configured with this repo's Terraform files.
- The TFC API token and AWS credentials used by remote runs are held server-side in Base44-hosted backend functions — never in the browser.
- See [`secure-orbit-deploy/tfc-functions/README.md`](secure-orbit-deploy/tfc-functions/README.md) for the backend function source and the one-time setup (Terraform Cloud org/token, AWS credentials, Base44 secrets) required to wire it up.

### Architecture & demo preview

[`docs/preview/index.html`](docs/preview/index.html) is a standalone page (open it directly in a browser, no server needed) that diagrams the full pipeline — React dashboard → Base44 functions → Terraform Cloud → AWS lab — and walks through real screenshots of the Deployments page (form, live plan, streamed deploy log, history) captured by driving the actual app code with its Base44/Terraform Cloud network calls mocked.

### Quick local preview without a real Base44 backend

To poke at the dashboard UI without a live Base44 app or Terraform Cloud account:
1. `cd secure-orbit-deploy && npm install`
2. Set `VITE_BASE44_APP_ID` in `.env.local` to the id from `secure-orbit-deploy/base44/.app.jsonc` (avoids an `appId: null` error). Leave `VITE_BASE44_APP_BASE_URL` unset.
3. `npm run dev` — the app shell and login page will render, but pages behind `ProtectedRoute` need a real authenticated session (or mocked network responses, as in the demo preview above) since there's no backend to authenticate against locally.

### Deploying the dashboard to the cloud

`secure-orbit-deploy` is a static Vite/React single-page app, so it deploys the same way regardless of host: run `npm run build` to produce `dist/`, then serve those static files. `VITE_BASE44_APP_ID` / `VITE_BASE44_APP_BASE_URL` are **build-time** values (Vite inlines them into the bundle) — set them wherever you run the build, not as runtime server env vars.

#### Option A: Docker container (any cloud)

[`secure-orbit-deploy/Dockerfile`](secure-orbit-deploy/Dockerfile) is a multi-stage build: it builds the app with Node, then serves `dist/` with nginx (config in [`secure-orbit-deploy/nginx.conf`](secure-orbit-deploy/nginx.conf), which includes the SPA fallback React Router needs for deep links like `/deployments`).

```bash
cd secure-orbit-deploy
docker build \
  --build-arg VITE_BASE44_APP_ID=your_app_id \
  --build-arg VITE_BASE44_APP_BASE_URL=your_backend_url \
  -t secorbit-deploy .

docker run -p 8080:80 secorbit-deploy   # verify at http://localhost:8080
```

From there, push the image to a registry and run it anywhere that runs containers:

- **AWS ECS / Fargate** (consistent with the rest of this project being AWS-based): push to ECR (`aws ecr create-repository ... && docker push ...`), create a Fargate service with a single container on port 80 behind an ALB.
- **AWS App Runner**: point it at the ECR image directly — simplest AWS path, no cluster/ALB to manage.
- **Google Cloud Run**: `gcloud run deploy --image <your-image> --port 80`.
- **Kubernetes (any provider)**: a `Deployment` + `Service`/`Ingress` exposing port 80 from the image.

#### Option B: Static hosting (no container)

Since the build output is plain static files, any static host works — just remember to configure a SPA fallback (unknown paths → `index.html`) so client-side routes don't 404:

- **Vercel / Netlify**: connect the repo, set build command `npm run build` and output directory `dist` (in the `secure-orbit-deploy` subdirectory), add `VITE_BASE44_APP_ID`/`VITE_BASE44_APP_BASE_URL` as build environment variables. Both auto-detect the Vite SPA fallback.
- **AWS S3 + CloudFront**: `npm run build`, sync `dist/` to an S3 bucket (`aws s3 sync dist/ s3://your-bucket --delete`), serve through CloudFront with a custom error response mapping 403/404 → `/index.html` (200) for SPA routing.

#### Option C: Base44's own hosting

Since this is a Base44 project, the simplest path is what's already in [Running it locally](#running-it-locally) above: push to this repo, then click **Publish** at [Base44.com](http://base44.com) — Base44 builds and hosts it for you, no Dockerfile or registry needed.

> The Terraform Cloud backend functions (`tfc-functions/`) are separate from this — they're deployed through the Base44 editor regardless of how you host the frontend; see [`secure-orbit-deploy/tfc-functions/README.md`](secure-orbit-deploy/tfc-functions/README.md).

## Repo hygiene

- `.terraform/`, `.terraform.lock.hcl`, `*.tfstate*`, and `terraform.tfvars` are gitignored — only `terraform.tfvars.example` (placeholder values) is tracked.
- Run `terraform fmt -recursive` and `terraform validate` before committing changes to the `.tf` files.
