#!/bin/bash

NGROK_PORT=8081
GITHUB_REPO_OWNER="DanhNguyennene"
GITHUB_REPO_NAME="DanhVuiVe"
GITHUB_WEBHOOK_ID="549801035"  
read -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN

if [[ -z "$GITHUB_TOKEN" ]]; then
    echo "Error: GitHub token cannot be empty."
    exit 1
fi

kill_ngrok() {
    echo "Checking for running ngrok processes..."

    NGROK_PIDS=$(ps aux | grep '[n]grok' | awk '{print $2}')

    if [[ -z "$NGROK_PIDS" ]]; then
        echo "No running ngrok processes found."
    else
        echo "Found running ngrok processes. Killing them..."
        for PID in $NGROK_PIDS; do
            echo "Killing ngrok process with PID: $PID"
            kill -9 "$PID" 2>/dev/null
        done
        echo "All ngrok processes have been terminated."
    fi
}

kill_ngrok
read -p "Enter your ngrok authtoken: " NGROK_AUTHTOKEN
if [[ -z "$NGROK_AUTHTOKEN" ]]; then
    echo "Error: ngrok authtoken cannot be empty."
    exit 1
fi

NGROK_CONFIG_FILE="ngrok.yml"

cat <<EOF > "$NGROK_CONFIG_FILE"
version: "2"
authtoken: $NGROK_AUTHTOKEN
tunnels:
  jenkins:
    proto: http
    addr: $NGROK_PORT
EOF
echo "Starting ngrok on port $NGROK_PORT..."
ngrok start --all --config ngrok.yml > /dev/null &
sleep 5  # Wait for ngrok to initialize

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
if [[ -z "$NGROK_URL" ]]; then
    echo "Failed to retrieve ngrok URL. Exiting."
    exit 1
fi

echo "ngrok public URL: $NGROK_URL"

echo "Updating GitHub webhook with URL: $NGROK_URL..."

API_URL="https://api.github.com/repos/$GITHUB_REPO_OWNER/$GITHUB_REPO_NAME/hooks/$GITHUB_WEBHOOK_ID" 
RESPONSE=$(curl -X PATCH \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "$API_URL" \
  -d '{
    "config": {
      "url": "'"$NGROK_URL"'/github-webhook/",
      "content_type": "json"
    }
  }')

if [[ $(echo "$RESPONSE" | jq -r '.message') == "Not Found" ]]; then
    echo "Failed to update webhook. Check your repository owner, name, webhook ID, or token."
    exit 1
elif [[ $(echo "$RESPONSE" | jq -r '.updated_at') != "null" ]]; then
    echo "Webhook updated successfully!"
else
    echo "Unexpected response from GitHub API: $RESPONSE"
    exit 1
fi