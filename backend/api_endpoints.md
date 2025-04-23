# 🗳️ Election API Overview

A summary of available endpoints for querying election results by state, candidate, and vote type.

---

## 📊 General Results

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | `/results`        | Get **all national results**    |
| GET    | `/results/popular`      | Get total popular vote results |
| GET    | `/results/electoral`    | Get total electoral vote results |
| GET    | `/results/general`        | Get **all national results**    |
| GET    | `/results/general/popular`      | Get total popular vote results |
| GET    | `/results/general/electoral`    | Get total electoral vote results |
| GET    | `/results/general/{year}/state/{state_name}/{race_type}`    | Get results for specific race within state |

Example:
```
GET /results/general/2024/state/CA/governor
```

---

## 📍 State-Level Results

| Method | Endpoint               | Description                              |
|--------|------------------------|------------------------------------------|
| GET    | `/results/:state`      | Get **popular votes** for a specific state |
| GET    | `/results/:state/popular`      | Get **popular votes** for a specific state |
| GET    | `/results/:state/electoral`      | Get **electoral votes** for a specific state |
| GET    | `/results/:state/:candidate`      | Get **popular votes by candidate** for a specific state |
| GET    | `/results/:state/:candidate/popular`      | Get **popular votes by candidate** for a specific state |
| GET    | `/results/:state/:candidate/electoral`       | Get **electoral votes by candidate** for a specific state |


Example:
```http
GET /results/tx
```

---

## 📊 County, District, and Precinct

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | `/results/county`        | Get county results
| GET    | `/results/district`    | Get district results
| GET    | `/results/precinct`    | Get district results


---

## 📆 Year Filter

All endpoints support an optional `year` query parameter to retrieve data for a specific election year.

### 🔍 Example:
```http
GET /results/tx?year=2024
GET /results/popular?year=2020
GET /results/pa/biden/popular?year=2016
```

---

## 📊 Demographics

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | `/demographics/approval`        | Get county results
| GET    | `/demographics/gender`    | Get district results
| GET    | `/demographics/race`    | Get district results
| GET    | `/demographics/age`    | Get district results
| GET    | `/demographics/education`    | Get district results
| GET    | `/demographics/party`    | Get district results

---

## 📊 Voter Turnout, Early Voting, Absentee Ballots

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | `/results/voter-turnout`        | Get **all national results**    |
| GET    | `/results/early-voting`      | Get total popular vote results |
| GET    | `/results/absentee`    | Get total electoral vote results |
| GET    | `/results/election-day-voting`        | Get **all national results**    |
| GET    | `/results/provisional`      | Get total popular vote results |
| GET    | `/results/registration`    | Get total electoral vote results |
| GET    | `/results/rejected`    | Get results for specific race within state |



## 📊 Primary Results
