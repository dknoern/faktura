# GitHub Actions Workflow for Docker Build and Push

This workflow builds the Lager2 Docker image and pushes it to DockerHub.

## Setup Instructions

Before you can use this workflow, you need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Add the following secrets:

   - `DOCKERHUB_USERNAME`: Your DockerHub username
   - `DOCKERHUB_TOKEN`: Your DockerHub access token (not your password)

## Getting a DockerHub Access Token

1. Log in to [DockerHub](https://hub.docker.com/)
2. Click on your username in the top right corner
3. Click on "Account Settings" > "Security"
4. Under "Access Tokens", click "New Access Token"
5. Provide a description (e.g., "GitHub Actions") and choose appropriate permissions
6. Click "Generate" and copy the token immediately (it won't be shown again)

## Manual Trigger

You can manually trigger this workflow:
1. Go to the "Actions" tab in your GitHub repository
2. Select "Build and Push Docker Image" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"
