# LifeMode legal and privacy readiness checklist

**Status:** Not legally approved. This document is a product/operator checklist, not legal advice.

LifeMode is in early access. Do not describe the current Privacy Notice or Terms of Use as final legal documents until the items below are resolved with the actual operator and qualified counsel.

## Operator and ownership

- [ ] Confirm the individual or legal entity operating LifeMode.
- [ ] Confirm who owns the source code, brand assets, designs, domain, and other intellectual property.
- [ ] Confirm whether the project is operated personally or through a registered business.
- [ ] Confirm the official support and privacy contact address.
- [ ] Confirm the official notice address and grievance / privacy escalation process where required.
- [ ] Have the proposed proprietary LICENSE notice reviewed by the rights holder.

## Personal data inventory

- [ ] Map every field collected during registration and onboarding, including age and profile fields.
- [ ] Map every database table, storage bucket, analytics event, log and backup that can contain user data.
- [ ] Document why each data category is needed and the feature that uses it.
- [ ] Document retention periods and deletion behavior for primary records, logs, backups and third-party processors.
- [ ] Document account export coverage and test that exports contain all relevant user data.
- [ ] Test account deletion end-to-end, including dependent rows, storage objects, AI conversation history, backups and authentication identity.
- [ ] Identify every AI provider and other processor that may receive user content, what is sent, and where it is processed.
- [ ] Review processor terms, data-processing terms, security controls and international data-transfer arrangements.
- [ ] Identify analytics, cookies, local storage, service-worker caches and other tracking or device storage.

## Age and child-safety review

- [ ] The current sign-up screen accepts users from age 13. Do not assume that this setting alone satisfies applicable law.
- [ ] Determine the intended age range and launch jurisdictions before enabling broad public registration.
- [ ] Review parental / guardian consent, age assurance, child-data processing, age-appropriate notices and feature restrictions for every launch jurisdiction.
- [ ] Review AI interactions, public profile discovery, social features, messaging, user-generated content and reporting/moderation safeguards for younger users.
- [ ] Confirm that any adult-only features are technically restricted and cannot be accessed by under-18 accounts.

For India, review the Digital Personal Data Protection Act, 2023, the Digital Personal Data Protection Rules, 2025 and the applicable commencement notifications. The Rules were notified with staged commencement provisions; do not assume that publication means every provision has already commenced. Check the current Gazette and obtain jurisdiction-specific advice.

Official references:
- [Digital Personal Data Protection Rules, 2025 — Gazette of India, G.S.R. 846(E)](https://egazette.gov.in/WriteReadData/2025/267650.pdf)
- [Ministry of Electronics and IT / PIB release on the Rules](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190655)
- [DPDP Act commencement notification — G.S.R. 843(E)](https://egazette.gov.in/WriteReadData/2025/267649.pdf)

## Public policies

- [ ] Add the operator's verified legal name and contact details to the Privacy Notice.
- [ ] Add categories of personal data, purposes, lawful basis / consent model, and the actual service providers.
- [ ] Explain AI-provider processing and any international transfers in plain language.
- [ ] Publish retention periods and the actual process for access, correction, withdrawal, grievance and deletion requests.
- [ ] Explain cookies, local storage, service-worker behavior and analytics accurately.
- [ ] Add the required jurisdiction-specific notices and contact / grievance details.
- [ ] Complete Terms of Use: operator identity, eligibility, user content, acceptable use, third-party services, service availability, IP, payment/refund rules if payments are enabled, liability and dispute process.
- [ ] Ensure signup consent records the exact policy version and timestamp.
- [ ] Obtain legal review before presenting the policies as final.

## Known technical blocker from the current production configuration

The account deletion API requires the server-only `SUPABASE_SERVICE_ROLE_KEY`. The production environment inventory inspected on 27 November 2026 did not show that variable. The endpoint therefore cannot be assumed to complete account deletion in production. Configure it securely only after review, then test deletion with a dedicated test account. Never expose it with a `NEXT_PUBLIC_` prefix.

The current export route also needs a completeness test against the actual database schema and all user-related storage before the Privacy Notice promises a complete export.

## Release gate

Do not call LifeMode legally launch-ready until:

- the operator and IP owner are confirmed;
- age and child-safety requirements are reviewed for launch markets;
- privacy contacts, processors and retention are documented;
- export and deletion are tested end-to-end;
- all third-party asset and package notices are accounted for; and
- qualified counsel has reviewed the final public policies.
