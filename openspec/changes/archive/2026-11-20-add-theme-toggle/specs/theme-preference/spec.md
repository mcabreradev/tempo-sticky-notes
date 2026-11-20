# Spec Delta

## Purpose

Covers how the user chooses between the system colour scheme, light and dark, and how that choice is
applied to the whole board surface.

## ADDED Requirements

### Requirement: Theme control with three explicit options

The toolbar SHALL offer a theme control with three options — System, Light and Dark — and SHALL expose
the selected option to assistive technology.

#### Scenario: Choosing dark applies the dark theme
- **WHEN** the user activates "Dark theme"
- **THEN** the application renders in the dark palette and the document root reports `data-theme="dark"`

#### Scenario: Choosing light applies the light theme
- **WHEN** the user activates "Light theme"
- **THEN** the application renders in the light palette and the document root reports `data-theme="light"`

#### Scenario: The selected option is announced
- **WHEN** the user moves through the three options
- **THEN** exactly one option reports itself as checked, and it matches the applied theme

### Requirement: An explicit choice overrides the operating system

While Light or Dark is selected, the application SHALL ignore the operating system's colour scheme.

#### Scenario: Light on a dark system stays light
- **WHEN** the operating system prefers dark and the user has selected "Light theme"
- **THEN** the application stays in the light palette until the user changes the selection

### Requirement: System mode follows the operating system, live

While System is selected, the application SHALL match the operating system's colour scheme and SHALL
react to a change of that scheme without a reload.

#### Scenario: A system change is picked up immediately
- **WHEN** the operating system switches from light to dark while the application is open in System mode
- **THEN** the application switches to the dark palette without reloading

### Requirement: The preference persists and invalid values fall back

The chosen preference SHALL survive a reload. Missing or invalid stored values SHALL fall back to
System without breaking the board.

#### Scenario: Reload keeps the chosen theme
- **WHEN** the user selects "Dark theme" and reloads the page
- **THEN** the application starts in the dark palette with "Dark theme" selected

#### Scenario: A corrupt preference falls back to System
- **WHEN** the stored preference is not one of the three valid values
- **THEN** the application follows the operating system and the control reports System as selected

### Requirement: The theme is applied before the first paint

The stored preference SHALL be applied during document load, so the first painted frame already uses the
correct scheme.

#### Scenario: No flash of the wrong theme
- **WHEN** the user reloads with Dark selected on a light operating system
- **THEN** the first rendered frame is dark, with no intermediate light frame
