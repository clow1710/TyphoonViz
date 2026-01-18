<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1MZweVt3ekre0tWRlLyPmojzH7jsVnJzM

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with Docker

**Prerequisites:** Docker

### Build the Docker image

```bash
docker build -t typhoon-viz .
```

### Run the container

Run on default port (41001):
```bash
docker run -d -p 41001:41001 typhoon-viz
```

Run on a custom port (e.g., 8080):
```bash
docker run -d -p 8080:8080 -e PORT=8080 typhoon-viz
```

### Pull from GitHub Container Registry

If the image is published to GHCR, you can pull it directly:

```bash
# Pull the latest image
docker pull ghcr.io/<owner>/typhoon-viz:latest

# Run the container
docker run -d -p 41001:41001 ghcr.io/<owner>/typhoon-viz:latest
```

## GitHub Actions

This project includes a GitHub Actions workflow that automatically builds and pushes the Docker image to GitHub Container Registry (GHCR) on:

- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch
- Version tags (e.g., `v1.0.0`)
- Manual workflow dispatch

The workflow can be triggered manually from the Actions tab with a custom port configuration.
