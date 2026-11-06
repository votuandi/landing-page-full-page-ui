import { defineConfig } from "@playwright/test";
import admin from "./playwright.admin.config";

// E14-S02: conversion smoke on preset-built tenants. Same admin (3300) + web (3212) servers and env as the admin suite.
export default defineConfig({
  ...admin,
  testMatch: "journey.spec.ts", globalSetup: "./journey.global-setup.ts", outputDir: "test-results/journey",
});
