# Pixel 10 Journal

A secure, private, offline-first journaling application built with React, Vite, and Firebase.

## Deployment to Firebase Hosting

This project is configured to deploy to Firebase Hosting automatically via GitHub Actions whenever changes are pushed to the \`main\` branch.

### Setup Instructions

For the deployment to succeed, you must provide the GitHub Action with permission to deploy to your Firebase project.

1. Generate a Service Account key from your Google Cloud Console / Firebase Console.
2. In your GitHub repository, navigate to **Settings > Secrets and variables > Actions**.
3. Create a new repository secret with the following details:
   - **Name**: \`FIREBASE_SERVICE_ACCOUNT\`
   - **Secret**: Paste the entirely of the JSON string from the generated service account key file.
4. Push your code to the \`main\` branch to trigger the deployment pipeline.
