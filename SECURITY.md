# Security Policy

## Overview

This repository contains GitHub Actions workflows, CI/CD pipelines, deployment automation, and .NET applications.

The objective of this security policy is to ensure secure development, code review, artifact management, and production deployments.

---

# Supported Versions

| Branch | Status |
|---------|--------|
| master | ✅ Supported |
| patch-cicd-demo | ✅ Supported |
| feature/* | ⚠ Development Only |

Only the **master** branch is considered production-ready.

---

# Reporting a Security Vulnerability

If you discover a security vulnerability, please do **not** create a public GitHub Issue.

Instead:

- Contact the repository owner privately.
- Include detailed reproduction steps.
- Provide logs or screenshots if applicable.
- Allow time for investigation before public disclosure.

Repository Owner:

- Varshith Chand

---

# Branch Protection

The **master** branch is protected by the following rules:

- Pull Request required
- Minimum one approval required
- Force pushes disabled
- Branch deletion disabled
- Conversation resolution required before merge

Developers must never push directly to the master branch.

---

# Pull Request Policy

Every Pull Request must:

- Pass all CI workflows
- Build successfully
- Pass automated tests
- Be reviewed by an authorized reviewer
- Receive required approvals before merging

---

# Secrets Management

Sensitive information must **never** be committed to the repository.

Examples include:

- API Keys
- Azure Credentials
- AWS Keys
- Database Passwords
- Personal Access Tokens
- SSH Keys
- Private Certificates

Instead, store secrets in:

Settings → Secrets and Variables → Actions

---

# Artifact Security

Artifacts are automatically generated during CI.

Artifact storage policy:

```
New
↓

Old1
↓

Old2
```

Artifacts include:

- Sprint Number
- Patch Number
- Timestamp

Only validated artifacts are deployed.

---

# Deployment Security

Deployments are protected using GitHub Environments.

Deployment flow:

```
Developer

↓

CI Build

↓

Artifact Created

↓

Pull Request

↓

Approval

↓

Merge

↓

RC Approval

↓

Deploy RC

↓

Production Approval

↓

Cluster01

↓

Cluster02

↓

Cluster03
```

Production deployments require manual approval.

---

# GitHub Actions Security

Workflows follow these practices:

- Least privilege permissions
- Repository-scoped permissions
- Manual approvals for production
- Environment protection rules
- Branch protection enforcement

Only trusted workflows may deploy production artifacts.

---

# Code Review Policy

Every code change should be reviewed for:

- Security
- Maintainability
- Performance
- Coding Standards
- Dependency Updates

No code should be merged without review.

---

# Dependency Management

Developers should:

- Keep NuGet packages updated
- Remove unused dependencies
- Update vulnerable packages promptly
- Review dependency changes during Pull Requests

---

# Recommended GitHub Security Features

Enable the following features for this repository:

- Secret Scanning
- Dependabot Alerts
- Dependabot Security Updates
- CodeQL Code Scanning
- Push Protection
- Branch Protection Rules

---

# Developer Responsibilities

Developers must:

- Follow secure coding practices
- Never commit secrets
- Raise Pull Requests for all changes
- Resolve CI failures before requesting review
- Test code before pushing

---

# Repository Administrator Responsibilities

Repository administrators are responsible for:

- Managing repository permissions
- Reviewing Pull Requests
- Approving production deployments
- Maintaining branch protection rules
- Managing GitHub Secrets
- Reviewing security alerts

---

# Security Best Practices

- Enable Multi-Factor Authentication (MFA)
- Use strong passwords
- Regularly rotate credentials
- Keep dependencies updated
- Review GitHub security alerts
- Use least-privilege permissions
- Monitor GitHub Actions workflow runs

---

# Contact

For security-related concerns, contact the repository owner directly before publicly disclosing any vulnerabilities.
