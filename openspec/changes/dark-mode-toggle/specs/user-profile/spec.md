## ADDED Requirements

### Requirement: Profile page displays a theme selector
The Profile page SHALL include a Theme section with three options: Light, Dark, and System.

#### Scenario: Theme section visible on profile page
- **WHEN** user navigates to the Profile page
- **THEN** a Theme section is visible with Light, Dark, and System options

#### Scenario: Current preference highlighted
- **WHEN** user opens the Profile page
- **THEN** the currently active theme option is visually indicated as selected

### Requirement: Selecting a theme takes effect immediately
The system SHALL apply the chosen theme as soon as the user selects it, without requiring a page reload.

#### Scenario: Switching to dark mode
- **WHEN** user clicks Dark on the Profile page
- **THEN** the UI switches to dark mode immediately and the selection is saved

#### Scenario: Switching to system
- **WHEN** user clicks System on the Profile page
- **THEN** the UI adopts the OS color scheme immediately
