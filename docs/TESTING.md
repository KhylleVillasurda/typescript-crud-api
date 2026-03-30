# Testing Guide

This guide covers testing the TypeScript CRUD API using Postman.

## Importing the Postman Collection

1. Open Postman
2. Click **Import** (top left)
3. Select the `postman_collection.json` file from the project root
4. The collection will load with all test requests

## API Base URL

```
http://localhost:4000
```

Ensure your server is running before executing requests:

```bash
npm run start:dev
```

## CRUD Operations

### 1. Create User (POST)

**Endpoint:** `POST /users`

**Request Body:**

```json
{
  "title": "Mr",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "User"
}
```

**Expected Response (201 Created):**

```json
{
  "message": "User created"
}
```

**Required Fields:**

- `title`: String
- `firstName`: String
- `lastName`: String
- `email`: Valid email format
- `password`: Minimum 6 characters
- `confirmPassword`: Must match password
- `role`: "Admin" or "User" (optional, defaults to "User")

---

### 2. Get All Users (GET)

**Endpoint:** `GET /users`

**Request Body:** None

**Expected Response (200 OK):**

```json
[
  {
    "id": 1,
    "title": "Mr",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "User",
    "createdAt": "2024-03-31T10:00:00.000Z",
    "updatedAt": "2024-03-31T10:00:00.000Z"
  }
]
```

**Note:** Password hashes are excluded from responses (except when using `withHash` scope).

---

### 3. Get User by ID (GET)

**Endpoint:** `GET /users/{id}`

**Example:** `GET /users/1`

**Expected Response (200 OK):**

```json
{
  "id": 1,
  "title": "Mr",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "User",
  "createdAt": "2024-03-31T10:00:00.000Z",
  "updatedAt": "2024-03-31T10:00:00.000Z"
}
```

**Error Response (404 Not Found):**

```json
{
  "message": "User not found"
}
```

---

### 4. Update User (PUT)

**Endpoint:** `PUT /users/{id}`

**Example:** `PUT /users/1`

**Request Body (all fields optional):**

```json
{
  "title": "Dr",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "role": "Admin"
}
```

**To update password:**

```json
{
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Expected Response (200 OK):**

```json
{
  "message": "User Updated"
}
```

---

### 5. Delete User (DELETE)

**Endpoint:** `DELETE /users/{id}`

**Example:** `DELETE /users/1`

**Request Body:** None

**Expected Response (200 OK):**

```json
{
  "message": "User deleted"
}
```

---

## Validation Rules

### Create User Validation

| Field             | Type   | Required | Rules                                  |
| ----------------- | ------ | -------- | -------------------------------------- |
| `title`           | String | Yes      | -                                      |
| `firstName`       | String | Yes      | -                                      |
| `lastName`        | String | Yes      | -                                      |
| `email`           | String | Yes      | Valid email format                     |
| `password`        | String | Yes      | Minimum 6 characters                   |
| `confirmPassword` | String | Yes      | Must match `password`                  |
| `role`            | String | No       | "Admin" or "User" (defaults to "User") |

### Update User Validation

| Field             | Type   | Required | Rules                                            |
| ----------------- | ------ | -------- | ------------------------------------------------ |
| `title`           | String | No       | -                                                |
| `firstName`       | String | No       | -                                                |
| `lastName`        | String | No       | -                                                |
| `email`           | String | No       | Valid email format                               |
| `password`        | String | No       | Minimum 6 characters, requires `confirmPassword` |
| `confirmPassword` | String | No       | Must match `password` if provided                |
| `role`            | String | No       | "Admin" or "User"                                |

---

## Error Responses

### Validation Error (400 Bad Request)

**Missing Required Field:**

```json
{
  "message": "Validation error details"
}
```

**Invalid Email Format:**

```json
{
  "message": "Email must be a valid email"
}
```

**Password Mismatch:**

```json
{
  "message": "confirmPassword must match password"
}
```

### Duplicate Email (400 Bad Request)

```json
{
  "message": "Email \"john@example.com\" is already registered"
}
```

### User Not Found (404 Not Found)

```json
{
  "message": "User not found"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "message": "Internal server error"
}
```

---

## Testing Bad Requests

The Postman collection includes 5 bad request test cases to verify error handling:

1. **Missing Email** - Tests required field validation
2. **Invalid Email** - Tests email format validation
3. **Password Too Short** - Tests minimum password length (6 characters)
4. **Password Mismatch** - Tests confirmPassword validation
5. **Invalid Role** - Tests role enum validation (only "Admin" or "User" allowed)

---

## Testing Tips

### 1. Set Variables in Postman

For easier testing, set collection variables:

1. Click the collection name in Postman
2. Go to **Variables** tab
3. Add:
   - `base_url`: http://localhost:4000
   - `user_id`: 1

4. Update requests to use `{{base_url}}/users/{{user_id}}`

### 2. Test in Sequence

For complete workflow testing:

1. **Create User** → Get user ID from response
2. **Get All Users** → Verify user was created
3. **Get User by ID** → Retrieve specific user
4. **Update User** → Modify user data
5. **Delete User** → Remove user

### 3. View Response Details

After each request:

- Check **Status** code
- Review **Body** (response data)
- Inspect **Headers** for content type
- Check **Tests** tab for automated assertions

### 4. Automated Testing

Add tests in Postman to verify responses:

```javascript
// Check status code
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Check response body
pm.test("User created successfully", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.message).to.eql("User created");
});
```

---

## Common Testing Scenarios

### Scenario 1: Create and Verify User

1. Execute **Create User** request
2. Copy the `email` from request body
3. Execute **Get All Users** and verify the new user appears

### Scenario 2: Update User and Verify

1. Create a user and note the `id`
2. Execute **Update User** with new data
3. Execute **Get User by ID** to confirm changes

### Scenario 3: Test Duplicate Email Prevention

1. Create a user with email: `test@example.com`
2. Try to create another user with same email
3. Verify you get: `"Email \"test@example.com\" is already registered"`

### Scenario 4: Delete and Verify

1. Create a user and note the `id`
2. Execute **Delete User** with that ID
3. Execute **Get User by ID** with same ID
4. Verify you get: `"User not found"`

---

## Debugging Failed Requests

If a request fails:

1. **Check Server** - Ensure TypeScript CRUD API is running
2. **Verify URL** - Confirm the endpoint path is correct
3. **Review Request Body** - Check JSON syntax and required fields
4. **Check MySQL** - Verify MySQL is running and configured
5. **View Server Logs** - Check terminal output for error details
6. **Inspect Response** - Look at response body for specific error message

---

## Next Steps

- Review the [Setup Guide](SETUP.md) if you need help configuring the application
- Check the main [README](../README.md) for project overview
