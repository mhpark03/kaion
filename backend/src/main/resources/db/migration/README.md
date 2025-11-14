# Database Migration Scripts

## Quick Start Guide

### If you have partial/incomplete data (levels exist but initialization incomplete):

```bash
# Step 1: Clear existing data
mysql -u root -p edutest < clear_data.sql

# Step 2: Restart the backend - initialization will run automatically
```

### If starting fresh or after schema changes:

```bash
# Apply schema fix
mysql -u root -p edutest < fix_subject_grade_nullable.sql

# Restart the backend - initialization will run automatically
```

## Migration Scripts

### fix_subject_grade_nullable.sql
Makes the `grade_id` column in the `subjects` table nullable, allowing subjects to exist without being tied to a specific grade (needed for the default "Science" subject).

**When to use:**
- After creating the database for the first time
- When you get "Column 'grade_id' cannot be null" error

### clear_data.sql
Clears all educational content data from the database to allow fresh initialization.

**When to use:**
- When you have partial data (e.g., only some levels or grades created)
- When initialization was interrupted due to errors
- When you want to restart with fresh data

## Using MySQL Command Line

```bash
mysql -u root -p edutest < script_name.sql
```

## Using MySQL Workbench or GUI Tools

1. Open the SQL file
2. Execute the script against the `edutest` database

## After Running Migrations

Restart the Spring Boot application. The DataInitializer will automatically populate the database with:
- 1 default Science subject
- 3 levels (초등학교, 중학교, 고등학교)
- 12 grades (E1-E6, M1-M3, H1-H3)
- 31+ units (대단원)
- Multiple subunits (소단원) and concepts (핵심 개념)

Total: Hundreds of educational content entries covering the Korean science curriculum.

