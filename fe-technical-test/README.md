# Work Order Schedule Timeline

A visual Work Order Schedule Timeline built with Angular 17+, ng-bootstrap, and ng-select.

## Features

- **Timeline Visualization**: View work orders across multiple work centers with Hour, Day, Week, and Month zoom levels.
- **Interactive Management**: 
    - Click on the grid to **Create** a new work order.
    - Click on a work order bar to **Edit** or **Delete** it.
- **Validation**:
    - Prevents overlapping work orders on the same work center.
    - Ensures valid date ranges.
- **Responsive Design**: Fixed sidebar with horizontally scrollable timeline.

## Tech Stack

- **Angular 17+** (Standalone Components)
- **SCSS** for styling
- **ng-bootstrap** for Datepickers
- **ng-select** for Dropdowns
- **Bootstrap 5** for grid/utilities

## Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- Angular CLI

### Installation

1. Navigate to the project directory:
   ```bash
   cd fe-technical-test
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Run the development server:

```bash
ng serve
```

Navigate to `http://localhost:4200/`.

## Key Decisions & Trade-offs

- **Timeline Rendering**: Implemented using a CSS-based grid with absolute positioning for bars. This allows for high performance without complex canvas dependencies.
- **Component Structure**: kept `TimelineComponent` as the smart container managing the grid state, while offloading form logic to `CreateEditPanelComponent`.
- **Date Handling**: Used native `Date` objects for calculations for simplicity in this demo. In a production app with complex timezone requirements, `luxon` or `date-fns` would be preferred.

## Documentation

See the `docs/` folder (or equivalent in your artifact bundle) for more process details.
