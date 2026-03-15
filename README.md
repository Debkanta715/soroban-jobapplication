# Job Application Contract on Soroban

A clean, production-style Soroban smart contract for job posting and application management.

## Why This Contract

This contract gives you a simple on-chain hiring flow:

- Employers create job posts.
- Applicants submit applications.
- Employers review and set result status.
- Anyone can query jobs and application IDs.

It is a strong base for hackathons, demos, or MVP products.

## Project Structure

```text
.
├── Cargo.toml
├── README.md
└── contracts
		└── hello-world
				├── Cargo.toml
				├── Makefile
				└── src
						├── lib.rs
						└── test.rs
```

Main files:

- Contract logic: `contracts/hello-world/src/lib.rs`
- Unit tests: `contracts/hello-world/src/test.rs`

## Features

### Employer Actions

- Create a new job post.
- Open or close an existing job.
- Accept or reject a submitted application.

### Applicant Actions

- Apply to an open job.
- View application details.
- List own application IDs.

### Safety Rules

- Auth is required for protected actions.
- Salary range is validated.
- Only job owner can update job/application state.
- One applicant cannot apply twice to the same job.

## Data Models

### Job

```rust
pub struct Job {
		pub id: u64,
		pub employer: Address,
		pub title: String,
		pub description: String,
		pub location: String,
		pub required_skills: Vec<String>,
		pub salary_min: i128,
		pub salary_max: i128,
		pub is_open: bool,
		pub created_at: u64,
}
```

### Application

```rust
pub struct Application {
		pub id: u64,
		pub job_id: u64,
		pub applicant: Address,
		pub cover_letter: String,
		pub resume_link: String,
		pub status: ApplicationStatus,
		pub applied_at: u64,
}
```

## Public Methods

```rust
create_job(...) -> u64
get_job(job_id) -> Option<Job>
set_job_open_status(employer, job_id, is_open)
apply_to_job(applicant, job_id, cover_letter, resume_link) -> u64
get_application(application_id) -> Option<Application>
set_application_status(employer, application_id, status)
list_job_application_ids(job_id) -> Vec<u64>
list_applicant_application_ids(applicant) -> Vec<u64>
```

## Quick Start

### 1. Run Unit Tests

From workspace root:

```bash
cargo test -p hello-world
```

### 2. Build WASM Contract

From `contracts/hello-world`:

```bash
stellar contract build
```

Expected output file (release build):

```text
contracts/hello-world/target/wasm32v1-none/release/hello_world.wasm
```

## CLI Usage Example (Local Sandbox)

These commands are a practical flow you can adapt.

### 1. Start local sandbox

```bash
stellar network start local
```

### 2. Deploy contract

```bash
stellar contract deploy \
	--network local \
	--source alice \
	--wasm contracts/hello-world/target/wasm32v1-none/release/hello_world.wasm
```

Save the returned contract ID:

```bash
CONTRACT_ID=<paste_contract_id_here>
```

### 3. Create a job

```bash
stellar contract invoke \
	--id $CONTRACT_ID \
	--network local \
	--source alice \
	-- create_job \
	--employer "$(stellar keys address alice)" \
	--title "Rust Smart Contract Engineer" \
	--description "Build and maintain Soroban contracts" \
	--location "Remote" \
	--required_skills '["Rust","Soroban","Testing"]' \
	--salary_min 4000 \
	--salary_max 9000
```

### 4. Apply to the job

```bash
stellar contract invoke \
	--id $CONTRACT_ID \
	--network local \
	--source bob \
	-- apply_to_job \
	--applicant "$(stellar keys address bob)" \
	--job_id 1 \
	--cover_letter "I build secure Rust contracts and test thoroughly." \
	--resume_link "https://example.com/bob-resume.pdf"
```

### 5. Accept application

```bash
stellar contract invoke \
	--id $CONTRACT_ID \
	--network local \
	--source alice \
	-- set_application_status \
	--employer "$(stellar keys address alice)" \
	--application_id 1 \
	--status Accepted
```

## Test Coverage

Current tests validate:

- Happy path: create job -> apply -> accept.
- Duplicate application is rejected.
- Non-owner status updates are rejected.

## Roadmap Ideas

- Pagination for large job lists.
- Profile and reputation score per address.
- Rich filtering by location, skills, and salary.
- Event logging for frontend-friendly indexing.

## License

Add your preferred license (MIT, Apache-2.0, or proprietary) before production deployment.
