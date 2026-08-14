# Contributing to PaperSteps

Thank you for helping make paperwork easier to complete.

## Good Contribution Areas

- Keyboard and screen-reader accessibility
- PDF field compatibility fixtures using synthetic data
- Plain-language interface improvements
- Browser compatibility
- Performance and bundle-size improvements
- Tests for malformed, encrypted, or unusual PDFs
- Documentation and translations of the PaperSteps interface

Do not commit real forms containing personal information. Test fixtures must be generated, public-domain, or explicitly licensed for redistribution.

## Development Setup

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run lint
npm run test
npm run build
```

## Pull Request Expectations

- Keep changes focused on one problem.
- Explain the user-facing behavior and privacy impact.
- Add tests for parsing, validation, or export changes.
- Include before and after screenshots for interface changes.
- Do not add analytics, remote uploads, or external AI services without prior discussion.
- Do not claim legal or official accuracy for community-written explanations.

Security and privacy concerns should follow [SECURITY.md](SECURITY.md), not a public issue.
