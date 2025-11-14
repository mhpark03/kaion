-- Clear all existing data to allow fresh initialization
-- Run this before restarting the backend

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE concepts;
TRUNCATE TABLE sub_units;
TRUNCATE TABLE units;
TRUNCATE TABLE grades;
TRUNCATE TABLE levels;
TRUNCATE TABLE subjects;

SET FOREIGN_KEY_CHECKS = 1;
