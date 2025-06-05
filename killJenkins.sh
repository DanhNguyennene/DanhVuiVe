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