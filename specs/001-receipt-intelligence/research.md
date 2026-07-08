# Research: UI/UX Navigation and Home Experience Improvement

## Decisions

### Decision 1: Replace the current top navigation with three primary tabs
- The navigation will be simplified to: Home, Statistics, and Receipts.
- The current Dashboard experience will become the new Home page, preserving its summary cards, search, and recent receipts content.
- The existing scan and manual-entry flows will be consolidated into one Receipts page.

**Rationale**: The current structure spreads receipt actions across multiple destinations and makes the primary workflow feel fragmented. A three-tab model is easier to understand and better matches the user journey.

**Alternatives considered**:
- Keeping the current dashboard and adding more links: rejected because it would preserve the fragmented experience.
- Using a four-tab structure with separate scan and manual pages: rejected because it adds cognitive load and duplicates actions.

### Decision 2: Keep the Statistics page largely unchanged
- The existing analytics experience will remain the main destination for charts and insights.
- Visual refinement will be applied, but the underlying metrics and charts will stay intact.

**Rationale**: The current statistics experience already delivers value and should not be reworked as part of this UI-focused improvement.

**Alternatives considered**:
- Replacing the statistics page with a different layout: rejected because it would increase risk and change the core analytics experience unnecessarily.

### Decision 3: Improve the home-page receipt presentation with smaller, denser cards
- Recent receipts on the Home page will use a more compact card layout with clearer hierarchy, smaller spacing, and stronger visual affordances.
- Cards will prioritize merchant, amount, date, and category while reducing visual weight.

**Rationale**: The current receipt cards are visually heavy and consume too much space on the main dashboard. A compact layout improves scanability and balances the page better.

**Alternatives considered**:
- Keeping the current large cards: rejected because they make the home page feel crowded.
- Showing only a list without cards: rejected because it would reduce visual clarity and make the experience feel less polished.

### Decision 4: Consolidate receipt creation into a single page with two entry modes
- The Receipts page will contain both receipt scanning and manual entry in a clearly separated, tabbed or card-based experience.
- The existing standalone routes will redirect to the new page to preserve continuity.

**Rationale**: Users should not need to leave the main receipts workflow to choose between scan and manual entry.

**Alternatives considered**:
- Leaving separate routes and adding a simple link: rejected because it does not solve the navigation fragmentation.
