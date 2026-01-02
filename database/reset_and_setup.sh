#!/bin/bash

# NeuroNote Database Reset and Setup Script
# This script resets the database and sets up a fresh schema

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}NeuroNote Database Reset and Setup${NC}"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL not set${NC}"
    echo "Please set your database connection string:"
    echo "  export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'"
    echo ""
    read -p "Enter your Supabase database URL (or press Ctrl+C to cancel): " DATABASE_URL
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Confirm action
echo -e "${YELLOW}WARNING: This will DROP ALL existing tables and data!${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${GREEN}Step 1: Dropping all tables...${NC}"
psql "$DATABASE_URL" -f "$MIGRATIONS_DIR/001_drop_all_tables.sql"
echo -e "${GREEN}✓ Tables dropped${NC}"

echo ""
echo -e "${GREEN}Step 2: Creating schema...${NC}"
psql "$DATABASE_URL" -f "$MIGRATIONS_DIR/002_create_schema.sql"
echo -e "${GREEN}✓ Schema created${NC}"

echo ""
echo -e "${GREEN}Step 3: Creating functions and triggers...${NC}"
psql "$DATABASE_URL" -f "$MIGRATIONS_DIR/003_create_functions_and_triggers.sql"
echo -e "${GREEN}✓ Functions and triggers created${NC}"

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up Storage buckets in Supabase Dashboard"
echo "2. Configure authentication settings"
echo "3. Test the schema with a test user"

