# Changelog

## Unreleased — docs & onboarding pass

Documentation-only changes. **No source code, no config, no behavior changed.**

### Added
- `README.md` rewritten from the create-next-app boilerplate to a project-specific
  README with quickstart, architecture diagram, usage, and an "interview talking
  points" section.
- `DOCS/REPO_OVERVIEW.md` — directory-by-directory map, runtime data flow,
  known issues / TODOs.
- `DOCS/SECURITY_NOTE.md` — flags the committed `.env.local` and lists the
  rotation + un-tracking steps the maintainer should take.
- `.env.example` — sanitized template for `OPENAI_API_KEY`, `OPENAI_BASE_URL`,
  `CHAT_MODEL`, `TAVILY_API_KEY`.
- `CHANGELOG.md` (this file).

### Not changed (deliberately, per user instruction)
- All source under `src/` is untouched.
- `.gitignore` is untouched. `.env.local` is still tracked — see
  `DOCS/SECURITY_NOTE.md` for the recommended fix.
- Empty/dead files (`src/components/project-list.tsx`,
  `src/app/projects/new/page.tsx`) and the unused
  `src/components/architecture-panel.tsx` are documented in
  `DOCS/REPO_OVERVIEW.md` but not removed.
