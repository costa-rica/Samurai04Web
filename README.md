# Samurai04Web

## Overview

This is the chat interface for the Samurai04 application built with Next.js and TypeScript. It will use Tailwind CSS for styling and Redux Toolkit for state management. The navigation and folder structure will use App Router.

### Overview TL;DR

- started from `npx create-next-app@latest`
  - No Turbopack -> this causes problems with the svg icons (src/icons)
- Heavily lifting the architecture from [free-nextjs-admin-dashboard-main](https://tailadmin.com/download)
- Customizeing it to fit the needs of the NewsNexus Portal.
- Uses App Router
- Uses TailwindCSS
- Uses Redux for state management
- Uses TypeScript

## Imports

### Required for Template

- `npm install @reduxjs/toolkit react-redux redux-persist`
- `npm install tailwind-merge`
- `npm i -D @svgr/webpack`
  - this requires a change to the next.config.ts file -- > see the file for details.
