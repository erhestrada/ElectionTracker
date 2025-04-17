# 🗳️ Election API Overview

A summary of available endpoints for querying election results by state, candidate, and vote type.

---

## 📊 General Results

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | `/results`        | Get **all national results**    |
| GET    | `/results/popular`      | Get total popular vote results |
| GET    | `/results/electoral`    | Get total electoral vote results |

---

## 📍 State-Level Results

| Method | Endpoint               | Description                              |
|--------|------------------------|------------------------------------------|
| GET    | `/results/:state`      | Get **popular votes** for a specific state |
| GET    | `/results/:state/:candidate`      | Get **popular votes by candidate** for a specific state |
| GET    | `/results/:state/:candidate/popular`      | Get **popular votes by candidate** for a specific state |
| GET    | `/results/:state/:candidate/electoral`       | Get **electoral votes by candidate** for a specific state |


Example:
```http
GET /results/tx
