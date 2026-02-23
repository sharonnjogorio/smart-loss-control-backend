# Test Scripts

This directory contains all test scripts for the Smart Loss Control API.

## Directory Structure

```
tests/
├── auth/              # Authentication tests
├── inventory/         # Inventory management tests
├── integration/       # Integration/end-to-end tests
└── api/              # API documentation tests
```

## Running Tests

### Authentication Tests

```bash
# Check registered owners
node tests/auth/check-owners.js

# Check staff users
node tests/auth/check-staff.js

# Create test staff user
node tests/auth/create-test-staff.js

# Test complete owner PIN registration & login flow
node tests/auth/test-owner-pin-flow.js
```

### Inventory Tests

```bash
# Test SKU deletion (soft delete)
node tests/inventory/test-delete-sku.js

# Test duplicate SKU prevention
node tests/inventory/test-duplicate-sku.js

# Test restock with supplier
node tests/inventory/test-restock-supplier.js

# Test sales sync
node tests/inventory/test-sales-sync.js
```

### Integration Tests

```bash
# Complete API flow test
node tests/integration/test-complete-flow.js

# Dashboard tests
node tests/integration/test-dashboard.js
node tests/integration/test-dashboard-with-data.js

# Shop management tests
node tests/integration/test-shop-management.js
node tests/integration/test-shop-management-v2.js
```

### API Tests

```bash
# Test Swagger documentation
node tests/api/test-swagger.js
```

## Prerequisites

- Server must be running: `npm start`
- Database must be initialized with migrations
- Environment variables must be configured in `.env`

## Test Data

Most tests use these default credentials:

- Owner Phone: `+2348099999999`
- Staff Name: `Chinedu`
- Staff PIN: `4321`

## Notes

- Tests are designed to be run independently
- Some tests create test data that persists in the database
- Integration tests may take longer to complete
- Check console output for detailed test results
