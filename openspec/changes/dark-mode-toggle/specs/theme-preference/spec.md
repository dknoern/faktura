## ADDED Requirements

### Requirement: Theme preference persists across sessions
The system SHALL persist the user's theme preference in localStorage so it survives page reloads and tab closes.

#### Scenario: Preference survives reload
- **WHEN** user selects Dark mode and reloads the page
- **THEN** the page renders in Dark mode without a flash of light mode

#### Scenario: System default on first visit
- **WHEN** user visits the app for the first time with no stored preference
- **THEN** the theme follows the OS `prefers-color-scheme` setting

### Requirement: Theme applies to the entire app
The system SHALL apply the selected theme globally by toggling the `dark` class on the `<html>` element.

#### Scenario: Dark class present when dark mode active
- **WHEN** user has Dark mode selected
- **THEN** the `<html>` element has the `dark` class and all `dark:` Tailwind variants take effect

#### Scenario: Dark class absent in light mode
- **WHEN** user has Light mode selected
- **THEN** the `<html>` element does not have the `dark` class

### Requirement: System theme follows OS preference dynamically
The system SHALL update the applied theme in real time when the OS color scheme changes, if the user has selected System mode.

#### Scenario: OS switches to dark
- **WHEN** user has System mode selected and switches OS to dark mode
- **THEN** the app switches to dark mode without a page reload
