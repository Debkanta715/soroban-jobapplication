# 🚀 Soroban Job Application Smart Contract

A decentralized **job posting and application system** built using **Rust and Soroban (Stellar Smart Contracts)**.

This smart contract allows employers to create jobs and applicants to apply securely on-chain.

---

# 📌 Features

- Create job postings
- Apply to job listings
- Accept or reject applications
- Prevent duplicate applications
- Restrict job state changes to job owners
- Query job and application data

---

# ⚙️ Smart Contract Functions

## Create Job
Creates a new job posting.

## Apply to Job
Allows an applicant to submit an application for a job.

## Change Application Status
Allows the job owner to **accept or reject** applications.

---

## List Job Applications

```rust
list_job_application_ids(env: Env, job_id: u64) -> Vec<u64>
```

Returns all application IDs for a specific job.

---

## List Applications by Applicant

```rust
list_applicant_application_ids(env: Env, applicant: Address) -> Vec<u64>
```

Returns all applications submitted by a specific applicant.

---

# 🔒 Built-In Validation Rules

The contract enforces the following rules:

- Salary cannot be negative
- `salary_max` cannot be less than `salary_min`
- Closed jobs cannot receive applications
- An applicant cannot apply to the same job twice
- Only the job owner can modify job state
- Only the job owner can change application status

---

# ⚠️ Error Types

```rust
InvalidSalaryRange = 1
JobNotFound = 2
ApplicationNotFound = 3
JobClosed = 4
NotJobOwner = 5
AlreadyApplied = 6
```

---

# 🧪 Running Tests

Run tests from the project root:

```bash
cargo test -p hello-world
```

---

# 🏗 Build the Smart Contract

```bash
cd contracts/hello-world
stellar contract build
```

Output:

```
target/wasm32v1-none/release/hello_world.wasm
```

---

# 🌐 Deployment Information

| Property | Value |
|--------|------|
Network | Testnet |
Alias | hello_world |
Package | hello-world |
WASM File | target/wasm32v1-none/release/hello_world.wasm |

---

# 🔗 Smart Contract Address

### Contract ID

👉 https://stellar.expert/explorer/testnet/contract/CBG5EZZWEYWGDGPZLLSCGNBQJPRDBDPSYCZ4PC3JAGATTTHRVQCUCHQJ

```
CBG5EZZWEYWGDGPZLLSCGNBQJPRDBDPSYCZ4PC3JAGATTTHRVQCUCHQJ
```

---

# 📸 Deployment Proof

Add your screenshot inside:

```
images/transction.png
```

Example:


![Contract Explorer Proof](transction.png)


---

# 📷 Screenshots

Store all images inside an **images folder**.

### Contract Deployment

```md
![Contract Deployment](images/contract-deploy.png)
```

### Create Job Example

```md
![Create Job](images/create-job.png)
```

### Apply to Job

```md
![Apply Job](images/apply-job.png)
```

### Test Results

```md
![Test Result](images/test-result.png)
```

---

# 🧾 Example Invoke Commands

## Create Job

```bash
stellar contract invoke \
--id hello_world \
--source-account alice \
--network testnet \
-- create_job \
--employer GBXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
--title "Rust Smart Contract Engineer" \
--description "Build secure Soroban applications" \
--location "Remote" \
--required_skills '["Rust","Soroban","Testing"]' \
--salary_min 3000 \
--salary_max 7000
```

---

## Get Job

```bash
stellar contract invoke \
--id hello_world \
--network testnet \
-- get_job \
--job_id 1
```

---

## Apply to Job

```bash
stellar contract invoke \
--id hello_world \
--source-account bob \
--network testnet \
-- apply_to_job \
--applicant GBYYYYYYYYYYYYYYYYYYYYYYYY \
--job_id 1 \
--cover_letter "I have Rust and smart contract experience." \
--resume_link "https://example.com/resume.pdf"
```

---

# 🧰 Tech Stack

- Rust (2021 edition)
- Soroban SDK v25
- Stellar Soroban CLI

---

# 🚀 Future Improvements

- Applicant profile storage
- Employer company profiles
- Job categories
- Pagination for large result sets
- Events for frontend indexing

---

# 📄 Summary

This repository contains a **complete Soroban smart contract project** for job posting and job application management with tests, build support, and deployment-ready WASM output.