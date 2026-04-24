## ADDED Requirements

### Requirement: Repository-tracked files must not contain live secrets
The system SHALL prevent live API keys and credentials from being stored in repository-tracked configuration or scripts.

#### Scenario: Runtime config for production frontend
- **WHEN** production frontend configuration is prepared
- **THEN** tracked files contain only non-sensitive placeholders and runtime values are supplied by deployment environment variables

#### Scenario: Script credential sourcing
- **WHEN** backend data scripts require third-party API authentication
- **THEN** credentials are read from environment variables and execution fails with a clear error when the variable is missing

### Requirement: Leaked credential remediation must be explicit
The system SHALL define mandatory remediation steps when a credential is discovered in repository history.

#### Scenario: Secret leak detected
- **WHEN** a leaked credential is identified in tracked files or git history
- **THEN** the team rotates the credential, removes it from active files, and performs repository history cleanup as part of incident response
