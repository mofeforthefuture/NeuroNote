#!/bin/bash

# NeuroNote Database Migration Runner
# Runs migrations in the correct order

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}NeuroNote Database Migration Runner${NC}"
echo "=================================="
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Get database connection details
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}DATABASE_URL not set. Please provide database connection:${NC}"
    read -p "Database host: " DB_HOST
    read -p "Database name: " DB_NAME
    read -p "Database user: " DB_USER
    read -sp "Database password: " DB_PASS
    echo ""
    
    export PGPASSWORD=$DB_PASS
    DB_URL="postgresql://$DB_USER@$DB_HOST/$DB_NAME"
else
    DB_URL="$DATABASE_URL"
fi

MIGRATIONS_DIR="$(cd "$(dirname "$0")/migrations" && pwd)"

# Migration files in order
MIGRATIONS=(
    "001_drop_all_tables.sql"
    "002_create_schema.sql"
    "003_create_functions_and_triggers.sql"
    "004_add_user_profiles_insert_policy.sql"
    "005_create_credits_system.sql"
    "006_add_token_tracking.sql"
)

echo -e "${YELLOW}Running migrations in order...${NC}"
echo ""

for migration in "${MIGRATIONS[@]}"; do
    MIGRATION_FILE="$MIGRATIONS_DIR/$migration"
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo -e "${RED}Error: Migration file not found: $migration${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Running: $migration${NC}"
    
    if psql "$DB_URL" -f "$MIGRATION_FILE" -v ON_ERROR_STOP=1; then
        echo -e "${GREEN}✓ Success: $migration${NC}"
    else
        echo -e "${RED}✗ Failed: $migration${NC}"
        exit 1
    fi
    
    echo ""
done

echo -e "${GREEN}All migrations completed successfully!${NC}"

