# DigiTuck

DigiTuck is a lightweight digital ordering platform designed for school tuckshops, campus vendors, and local spaza shops. The project aims to reduce customer waiting times by allowing users to browse products, place orders before arriving, and collect their purchases once they are ready.

The system is intended to improve the ordering experience for both customers and vendors. Customers benefit from faster, more convenient ordering, while vendors gain a more structured way to manage stock, review orders, and update preparation status.

## Project status

This repository currently contains project documentation and planning material only. It does not yet include a completed application, database schema, frontend implementation, backend service, or deployment configuration.

At this stage, all features described in this document should be treated as planned functionality rather than confirmed implementation. Any item not present in the repository should be regarded as a proposal or future requirement rather than a completed feature.

## Problem statement

Small local businesses often rely on informal and time-consuming ordering methods. Customers may wait in long queues, vendors may struggle to track orders, and stock information may be unclear or inconsistent. These issues can lead to delays, customer frustration, and inaccurate order handling.

DigiTuck aims to provide a simple and accessible digital ordering experience focused on speed, clarity, and convenience. The first version is intentionally limited to in-person collection and does not include delivery logistics or online payment processing.

## Objectives

The project aims to:

- allow customers to browse a vendor’s products and prices;
- make it easier to submit an order before arriving at the shop;
- help vendors view and manage incoming orders;
- improve visibility of stock and order status;
- reduce queue time and order-entry mistakes;
- keep the system simple for small businesses and users with limited mobile data;
- establish a foundation that can be extended after testing with real users.

## Target users

### Customers and students

DigiTuck is intended to help customers:

- browse available products and prices;
- check current product availability;
- add items to an order and review the total;
- submit an order before arriving at the shop;
- collect their order once it is prepared.

### Tuckshop and spaza shop vendors

DigiTuck is intended to help vendors:

- maintain product names, prices, and stock information;
- review incoming orders;
- accept or reject orders;
- update order preparation status.

### Administrator (optional)

If an administrative module is added later, it may support:

- managing vendor listings and user access;
- reviewing reports or disputes;
- monitoring activity where required.

## Planned features

The following features are part of the intended scope, but they are not confirmed as implemented in this repository.

### Minimum viable product (planned)

- [ ] customer-facing product catalogue;
- [ ] product prices and availability;
- [ ] shopping cart and order total;
- [ ] order submission and unique order reference;
- [ ] vendor view for incoming orders;
- [ ] order status updates (for example: Pending, Accepted, Preparing, Ready, Collected, Cancelled);
- [ ] vendor product and stock management;
- [ ] customer and vendor authentication.

### Future enhancements

- [ ] order history and basic reporting;
- [ ] responsive design for mobile and desktop screens;
- [ ] input validation and useful error messages;
- [ ] automated or documented tests;
- [ ] administrator management tools;
- [ ] notifications or reminders for order progress.

Payments, delivery logistics, and third-party integrations are not considered part of the first version and should not be described as available until they are implemented and validated.

## Typical order workflow

1. A customer opens DigiTuck and selects a shop.
2. The customer reviews the available products and prices.
3. The customer adds items to the cart and checks the total.
4. The system validates the order against current availability.
5. The customer submits the order.
6. The vendor reviews and accepts or rejects the order.
7. If accepted, the vendor prepares the order and updates the status.
8. The customer collects the order and the order is marked complete.

## Technology stack

No application technology stack has been selected or implemented in this repository yet.

The project has not yet confirmed a language, framework, database, deployment model, or payment provider. This information should only be added once the implementation exists and is verified in practice.

## Repository structure

The repository currently contains project documentation only.

```text
DigiTuck-
├── README.md
```

At present, there are no source code files, frontend or backend folders, package manager files, database scripts, or test files in this repository.

## Getting started

This repository does not yet contain a runnable application. As a result, there are no validated installation or execution instructions available at this time.

### Current state

- no backend code;
- no frontend code;
- no dependency files;
- no database configuration;
- no automated tests;
- no deployment configuration.

### Recommended next steps

1. select an implementation stack;
2. create the project structure;
3. define configuration and environment settings;
4. implement the core ordering workflow;
5. add database schema and sample data where required;
6. write tests for product browsing, ordering, and vendor management;
7. validate the system with a small pilot group;
8. update this README once the implementation is complete and verified.

## Configuration and security

- keep passwords, API keys, database credentials, and secrets out of source control;
- add local environment files and generated outputs to `.gitignore`;
- validate user input on both client and server sides where appropriate;
- enforce access control for vendor and administrator functions;
- do not store raw bank-card details;
- use HTTPS in deployed environments;
- collect only the minimum customer data required for the service;
- use fictional or sample data in demonstrations and screenshots.

## Testing strategy

Testing should be introduced once the application has been implemented. Before release, the project should validate at least the following:

- product lists display correct prices;
- unavailable products cannot be ordered;
- cart quantities and totals are calculated correctly;
- invalid or incomplete orders are rejected;
- vendor-only and administrator-only functions are restricted appropriately;
- new, accepted, rejected, and completed orders are clearly differentiated;
- errors are communicated clearly to users;
- the interface remains usable on small screens.

No formal test results are currently recorded in this repository.

## Roadmap

1. confirm requirements and project scope;
2. define the product catalogue and product data model;
3. implement cart functionality and order submission;
4. build the vendor workflow for stock and order management;
5. add validation, access control, and error handling;
6. create tests and documentation;
7. pilot the system with a small group of vendors and customers;
8. evaluate extensions such as payments, notifications, and delivery only after the core workflow is stable.

## Contributing

Contributions are welcome once the implementation begins.

1. create a branch for the planned change;
2. keep changes focused and explain the rationale;
3. run the relevant tests;
4. update documentation when behaviour or setup changes;
5. open a pull request describing the change and how it was tested.

## Limitations and important notes

- DigiTuck is intended for small local tuckshops and spaza shops, not large-scale delivery operations;
- product availability depends on vendors keeping stock information up to date;
- a prototype may not support real customer accounts, online payments, delivery, or production hosting;
- any school-based pilot must obtain the necessary approval and account for relevant school rules;
- the current state of this repository takes precedence over any planned functionality described in this document.

## License

No license has been selected for this project yet. Until a license is added, no assumption should be made that others may reuse, distribute, or modify the code.

## Author

Project: DigiTuck

Repository: https://github.com/itprojectgroup53-commits/DigiTuck-
