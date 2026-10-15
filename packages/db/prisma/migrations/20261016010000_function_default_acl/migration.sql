-- Schema defaults cannot revoke the database-wide PUBLIC EXECUTE default.
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
