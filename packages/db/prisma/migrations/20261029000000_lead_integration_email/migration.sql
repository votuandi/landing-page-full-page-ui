-- E11-S02: additive enum migration; existing integrations are unchanged.
ALTER TYPE "IntegrationKind" ADD VALUE 'email';
