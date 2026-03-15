# Soroban Job Application

A Soroban smart contract project for posting jobs and submitting job applications on Stellar.

This repository is a Rust workspace with one contract package in `contracts/hello-world`. The contract is written for Soroban and compiled to WASM for deployment.

## What This Contract Does

This contract supports a simple hiring workflow:

- An employer creates a job post.
- An applicant applies to that job.
- The employer accepts or rejects the application.
- The contract stores job and application IDs for lookup.

## Folder Structure

This README is based on the current project structure:

```text
soroban-jobapplication/
├── Cargo.toml
├── README.md
├── contracts/
│   └── hello-world/
│       ├── Cargo.toml
│       ├── Makefile
│       └── src/
│           ├── lib.rs
│           └── test.rs
└── target/
```

Important files:

- Root workspace config: `Cargo.toml`
- Contract code: `contracts/hello-world/src/lib.rs`
- Contract tests: `contracts/hello-world/src/test.rs`
- Contract package config: `contracts/hello-world/Cargo.toml`

## Contract Models

### Job

The contract stores each job with:

- `id`
- `employer`
- `title`
- `description`
- `location`
- `required_skills`
- `salary_min`
- `salary_max`
- `is_open`
- `created_at`

### Application

The contract stores each application with:

- `id`
- `job_id`
- `applicant`
- `cover_letter`
- `resume_link`
- `status`
- `applied_at`

### Status Enum

Application status can be:

- `Pending`
- `Accepted`
- `Rejected`

## Contract Methods

These are the public methods in your current code:

### Create a job

```rust
create_job(
		env: Env,
		employer: Address,
		title: String,
		description: String,
		location: String,
		required_skills: Vec<String>,
		salary_min: i128,
		salary_max: i128,
) -> u64
```

Returns the new `job_id`.

### Get a job

```rust
get_job(env: Env, job_id: u64) -> Option<Job>
```

### Open or close a job

```rust
set_job_open_status(env: Env, employer: Address, job_id: u64, is_open: bool)
```

Only the job owner can do this.

### Apply to a job

```rust
apply_to_job(
		env: Env,
		applicant: Address,
		job_id: u64,
		cover_letter: String,
		resume_link: String,
) -> u64
```

Returns the new `application_id`.

### Get an application

```rust
get_application(env: Env, application_id: u64) -> Option<Application>
```

### Update application status

```rust
set_application_status(
		env: Env,
		employer: Address,
		application_id: u64,
		status: ApplicationStatus,
)
```

Only the job owner can do this.

### List application IDs for a job

```rust
list_job_application_ids(env: Env, job_id: u64) -> Vec<u64>
```

### List application IDs for an applicant

```rust
list_applicant_application_ids(env: Env, applicant: Address) -> Vec<u64>
```

## Built-In Rules

Your current contract enforces these rules:

- salary cannot be negative
- `salary_max` cannot be less than `salary_min`
- a closed job cannot receive applications
- the same applicant cannot apply to the same job twice
- only the job owner can change job state
- only the job owner can change application status

## Error Types

The contract currently defines these errors:

```rust
InvalidSalaryRange = 1
JobNotFound = 2
ApplicationNotFound = 3
JobClosed = 4
NotJobOwner = 5
AlreadyApplied = 6
```

## How To Run

### Run tests from the workspace root

```powershell
cargo test -p hello-world
```

Your latest test run succeeded with 3 passing tests.

### Build the contract WASM

From the contract folder:

```powershell
cd contracts/hello-world
stellar contract build
```

Expected output:

```text
target/wasm32v1-none/release/hello_world.wasm
```

## Current Tests

Your test file currently checks these scenarios:

1. Create job, apply, and accept application
2. Prevent duplicate application to the same job
3. Prevent non-owner from changing application status

## Deployment Example

You already deployed using a command like this:

```powershell
stellar contract deploy `
	--wasm target/wasm32v1-none/release/hello_world.wasm `
	--source-account alice `
	--network testnet `
	--alias hello_world
```

## Smart Contract Address

Add your deployed contract details here so anyone reading the project can quickly find it.

### Deployment Info

- Network: `testnet`
- Contract alias: `hello_world`
- Contract package: `hello-world`
- WASM file: `target/wasm32v1-none/release/hello_world.wasm`

### Contract Address

Current deployed contract ID:

```text
Contract ID: CBG5EZZWEYWGDGPZLLSCGNBQJPRDBDPSYCZ4PC3JAGATTTHRVQCUCHQJ
```

If you want, you can also keep a shareable block like this:

```text
Project Name: Soroban Job Application
Network: testnet
Alias: hello_world
Contract ID: CBG5EZZWEYWGDGPZLLSCGNBQJPRDBDPSYCZ4PC3JAGATTTHRVQCUCHQJ
```

## Deployment Proof

This project has already been deployed to Stellar testnet.

Deployment proof details:

- Explorer: Stellar Lab Contract Explorer
- Network: testnet
- Alias: `hello_world`
- Contract ID: `CBG5EZZWEYWGDGPZLLSCGNBQJPRDBDPSYCZ4PC3JAGATTTHRVQCUCHQJ`

Suggested screenshot file for this proof:

```text
images/contract-explorer-testnet.png
```

If you save your uploaded screenshot in that path, this image block will render automatically:

```md
## Deployment Proof Screenshot

![Stellar Lab Contract Explorer - Testnet Deployment](images/contract-explorer-testnet.png)
```

## Images

You can keep all project screenshots inside an `images` folder.

Recommended files:

- `images/contract-explorer-testnet.png`
- `images/contract-deploy.png`
- `images/create-job.png`
- `images/apply-job.png`
- `images/test-result.png`

Example screenshots section:

```md
## Screenshots

### Deployment Proof
![Stellar Lab Contract Explorer - Testnet Deployment](images/contract-explorer-testnet.png)

### Contract Deployment
![Contract Deployment](images/contract-deploy.png)

### Create Job Example
![Create Job](images/create-job.png)

### Apply to Job Example
![Apply to Job](images/apply-job.png)

### Test Result
![Test Result](images/test-result.png)
```

## Example Invoke Commands

Replace values like contract ID and addresses with your real values.

### Create a job

```powershell
stellar contract invoke `
	--id hello_world `
	--source-account alice `
	--network testnet `
	-- create_job `
	--employer GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX `
	--title "Rust Smart Contract Engineer" `
	--description "Build secure Soroban applications" `
	--location "Remote" `
	--required_skills '["Rust","Soroban","Testing"]' `
	--salary_min 3000 `
	--salary_max 7000
```

### Get a job

```powershell
stellar contract invoke `
	--id hello_world `
	--source-account alice `
	--network testnet `
	-- get_job `
	--job_id 1
```

### Apply to a job

```powershell
stellar contract invoke `
	--id hello_world `
	--source-account bob `
	--network testnet `
	-- apply_to_job `
	--applicant GBYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY `
	--job_id 1 `
	--cover_letter "I have Rust and smart contract experience." `
	--resume_link "https://example.com/resume.pdf"
```

### Accept an application

```powershell
stellar contract invoke `
	--id hello_world `
	--source-account alice `
	--network testnet `
	-- set_application_status `
	--employer GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX `
	--application_id 1 `
	--status Accepted
```

### List applications for a job

```powershell
stellar contract invoke `
	--id hello_world `
	--source-account alice `
	--network testnet `
	-- list_job_application_ids `
	--job_id 1
```

## Tech Stack

- Rust 2021 edition
- Soroban SDK v25
- Stellar Soroban CLI

## Future Improvements

Good next features for this project:

- store applicant profile details
- store employer company profile
- add job categories
- add pagination for large result sets
- add events for indexing in a frontend app

## Summary

This repository is now a complete Soroban smart contract project for job posting and job application handling, with tests, build support, and deployment-ready WASM output.
