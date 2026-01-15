#!/bin/bash

# Generate historical verdict data from 2025-09-01 to 2026-01-09
BASE_URL="https://stock-hero-alpha.vercel.app/api/cron/daily-verdict"

# Start and end dates
START_DATE="2025-09-01"
END_DATE="2026-01-09"

# Convert to timestamps for iteration
current="$START_DATE"
end="$END_DATE"

echo "Starting historical data generation..."
echo "From: $START_DATE"
echo "To: $END_DATE"
echo ""

count=0
success=0
failed=0

while [[ "$current" < "$end" || "$current" == "$end" ]]; do
    count=$((count + 1))
    echo "[$count] Generating $current..."
    
    # Call API with force=true
    response=$(curl -s --max-time 120 "${BASE_URL}?date=${current}&force=true")
    
    # Check if successful
    if echo "$response" | grep -q '"success":true'; then
        success=$((success + 1))
        echo "  ✓ Success"
    else
        failed=$((failed + 1))
        echo "  ✗ Failed: $response"
    fi
    
    # Move to next day
    if [[ "$OSTYPE" == "darwin"* ]]; then
        current=$(date -j -v+1d -f "%Y-%m-%d" "$current" "+%Y-%m-%d")
    else
        current=$(date -d "$current + 1 day" "+%Y-%m-%d")
    fi
    
    # Small delay to avoid rate limiting
    sleep 1
done

echo ""
echo "===== Generation Complete ====="
echo "Total: $count"
echo "Success: $success"
echo "Failed: $failed"
