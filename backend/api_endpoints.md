# 🗳️ Election API Overview

A summary of available endpoints for querying election results by state, candidate, and vote type.

---

## 📊 General Results

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | `/election/presidential/national/popular/by-state`        | Get popular vote results for each candidate in each state |
| GET    | `/election/presidential/national/popular/total`      | Get the total popular votes for each candidate nationally |
| GET    | `/election/presidential/national/popular/percent`      | Get the percent of popular votes for each candidate nationally |
| GET    | `/election/presidential/national/electoral/by-state`        | Get electoral vote results for each candidate in each state |
| GET    | `/election/presidential/national/electoral/total`      | Get the total electoral votes for each candidate nationally |
| GET    | `/election/presidential/national/electoral/percent`      | Get the percent of electoral votes for each candidate nationally |

## 📍 State-Level Results

| Method | Endpoint               | Description                              |
|--------|------------------------|------------------------------------------|
| GET    | `/results/:state`      | Get **popular votes** for a specific state |
| GET    | `/results/:state/electoral`      | Get **electoral votes** for a specific state |
| GET    | `/results/:state/:candidate`      | Get **popular votes by candidate** for a specific state |
| GET    | `/results/:state/:candidate/electoral`       | Get **electoral votes by candidate** for a specific state |


Example:
```http
GET /results/tx
```

---

## 📊 County, District, and Precinct

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | `/:state/counties`        | Get counties in state
| GET    | `/:state/candidates`        | Get candidates and their party in state
| GET    | `/:state/contests`           | Get all election contests in state
| GET    | `/:state/precincts`           | Get all precincts in state
| GET    | `/:state/-election-day-votes?limit={limit}&offset={offset]}`           | Get election day votes




| GET    | `/results/:state/district`    | Get district results
| GET    | `/results/:state/precinct`    | Get district results


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

## 📊 Participation

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | `/participation/voter-turnout`        | Get **all national participation**    |
| GET    | `/participation/early-voting`      | Get total popular vote participation |
| GET    | `/participation/absentee`    | Get total electoral vote participation |
| GET    | `/participation/election-day-voting`        | Get **all national participation**    |
| GET    | `/participation/provisional`      | Get total popular vote participation |
| GET    | `/participation/registration`    | Get total electoral vote participation |
| GET    | `/participation/rejected`    | Get participation for specific race within state |


## 📊 Primary Results

## 📊 Calculations, Statistics

| Method | Endpoint          | Description                     |
|--------|-------------------|---------------------------------|
| GET    | `/statistics/voter-turnout-rate`    |   The percentage of eligible voters who cast a ballot. |
| GET    | `/statistics/early-voting-rate`      | The percentage of votes cast before Election Day, either in person or by mail.​ |
| GET    | `/statistics/absentee-voting-rate`    | The percentage of votes cast before Election Day, either in person or by mail.​ |
| GET    | `/statistics/vote-share`    | The percentage of total votes received by each candidate or party.​ |
| GET    | `/statistics/margin-of-victory`    | The difference in vote count between the winning candidate and the runner-up. (raw and percent)​ |
| GET    | `/statistics/ballot-rejection-rates`    | The percentage of ballots that are not counted due to errors or disqualification.​ |
| GET    | `/statistics/election-day-voting-patterns`    | Analysis of voting times and locations to identify peak voting periods and potential bottlenecks.​ |
| GET    | `/statistics/forensics`    | Detects anomalies in election results that may indicate fraud or irregularities.​ |
| GET    | `/statistics/regression-analysis`    | Identifies factors that influence voter turnout and election outcomes.​ |
| GET    | `/statistics/gerrymandering`    | Identifies potential partisan gerrymandering in district boundaries. |

```
Voter Turnout
(Total Votes Cast / Voting Eligibile Population) x 100

Early and Absentee Voting
(Early or Absentee Votes / Total Votes Cast) x 100

Vote Share
(Votes for Candidate or Party / Total Votes Cast) x 100

Forensics
    Benford's Law: Analyzes the frequency distribution of leading digits in vote counts.
    Digit Analysis: Examines the distribution of digits in vote counts for irregular patterns.
    Machine Learning: Utilizes algorithms to identify outliers and anomalies in election data.

Regression Analysis
    Example: A study found that the prevalence of absentee voting in 2020 had a moderately strong and statistically significant impact on turnout.

Gerrymandering
    Declination: Measures the difference between the proportion of votes and the proportion of seats won.
    Efficiency Gap: Quantifies wasted votes to assess the fairness of district boundaries.
```


