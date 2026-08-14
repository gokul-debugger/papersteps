# Security and Privacy

PaperSteps handles documents that may contain sensitive personal information. Privacy regressions are treated as security issues.

## Supported Version

Only the latest version on the default branch receives security fixes during the current pre-release stage.

## Reporting

Do not open a public issue containing a private document, personal information, access token, or reproducible exploit involving user data.

Report security concerns privately through GitHub's private vulnerability reporting feature once the public repository is available.

Include:

- The affected version or commit
- Browser and operating system
- Steps using synthetic or redacted data
- Expected and observed behavior
- Potential impact

## Trust Boundaries

The current application has no server component. It should not transmit PDFs or draft values over the network. Dependencies and externally loaded links remain outside the application's trust boundary.

Any future feature that transmits document content must be opt-in, clearly disclosed before transmission, and reviewed separately for data retention, encryption, and provider behavior.
