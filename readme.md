# NASA EPIC Earth Live Widget

A Chrome Extension that injects a high-end, glassmorphism floating widget into any webpage to display the latest live imagery of Earth from the NASA EPIC API.

---

## Legal Notice and License

**Copyright (C) 2024 Acquibi - All Rights Reserved.**

This software and its source code are proprietary. Unauthorized copying, modification, distribution, or commercial use of this code, via any medium, is strictly prohibited. 

* Commercial Use: Strictly Forbidden.
* Redistribution: Strictly Forbidden.
* Derivatives: No permission is granted to create derivative works.

This repository is provided for viewing and educational purposes only. By accessing this code, you acknowledge the author's full copyright and agree not to use this material in any unauthorized capacity.

---

## Features

* NASA EPIC Integration: Real-time fetching of the latest Blue Marble images.
* Glassmorphism UI: Elegant, blurred, semi-transparent interface designed with modern UX principles.
* Shadow DOM Encapsulation: Ensures the extension's styles never conflict with or break the host website.
* Loading States: Built-in spinner and smooth image fade-in transitions.
* Privacy First: Built on Manifest V3, adhering to the latest security standards.

---

## Installation (For Development Only)

Since this is a proprietary project, it must be loaded manually into Chrome:

1. Download or clone the repository to your local machine.
2. Open Google Chrome and navigate to chrome://extensions/.
3. Enable Developer Mode using the toggle in the top right corner.
4. Click the Load unpacked button.
5. Select the folder containing the extension files.

---

## Technical Architecture

* Manifest V3: Utilizes modern service worker and permission protocols.
* Shadow DOM: The entire UI is injected into a ShadowRoot to isolate styles from the global CSS scope of any visited website.
* NASA API: Dynamically reconstructs image URLs based on the Gregorian calendar logic required by the EPIC archive.

---

## Author

Developed and maintained by Acquibi (https://github.com/Acquibi).

If you have questions regarding the project or wish to request licensing permissions, please contact the author via GitHub.