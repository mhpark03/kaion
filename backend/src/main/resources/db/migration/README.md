# Database Migration Scripts

## How to Apply Migrations

These SQL scripts need to be run manually against your MySQL database.

### Using MySQL command line:

```bash
mysql -u root -p edutest < fix_subject_grade_nullable.sql
```

### Using MySQL Workbench or other GUI tools:

1. Open the SQL file
2. Execute the script against the `edutest` database

### What each migration does:

- **fix_subject_grade_nullable.sql**: Makes the `grade_id` column in the `subjects` table nullable, allowing subjects to exist without being tied to a specific grade (needed for the default "Science" subject).

## After Running Migrations

Restart the Spring Boot application. The DataInitializer will automatically populate the database with initial educational content.
