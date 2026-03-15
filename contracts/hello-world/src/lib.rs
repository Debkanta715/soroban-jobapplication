#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, vec, Address, Env,
    String, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidSalaryRange = 1,
    JobNotFound = 2,
    ApplicationNotFound = 3,
    JobClosed = 4,
    NotJobOwner = 5,
    AlreadyApplied = 6,
}

#[contracttype]
#[derive(Clone)]
pub enum ApplicationStatus {
    Pending,
    Accepted,
    Rejected,
}

#[contracttype]
#[derive(Clone)]
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

#[contracttype]
#[derive(Clone)]
pub struct Application {
    pub id: u64,
    pub job_id: u64,
    pub applicant: Address,
    pub cover_letter: String,
    pub resume_link: String,
    pub status: ApplicationStatus,
    pub applied_at: u64,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    NextJobId,
    NextApplicationId,
    Job(u64),
    Application(u64),
    JobApplicationIds(u64),
    ApplicantApplicationIds(Address),
}

#[contract]
pub struct Contract;
#[contractimpl]
impl Contract {
    pub fn create_job(
        env: Env,
        employer: Address,
        title: String,
        description: String,
        location: String,
        required_skills: Vec<String>,
        salary_min: i128,
        salary_max: i128,
    ) -> u64 {
        employer.require_auth();

        if salary_min < 0 || salary_max < salary_min {
            panic_with_error!(&env, Error::InvalidSalaryRange);
        }

        let id = next_job_id(&env);
        let job = Job {
            id,
            employer,
            title,
            description,
            location,
            required_skills,
            salary_min,
            salary_max,
            is_open: true,
            created_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Job(id), &job);
        id
    }

    pub fn get_job(env: Env, job_id: u64) -> Option<Job> {
        env.storage().persistent().get(&DataKey::Job(job_id))
    }

    pub fn set_job_open_status(env: Env, employer: Address, job_id: u64, is_open: bool) {
        employer.require_auth();

        let mut job: Job = match env.storage().persistent().get(&DataKey::Job(job_id)) {
            Some(value) => value,
            None => panic_with_error!(&env, Error::JobNotFound),
        };

        if job.employer != employer {
            panic_with_error!(&env, Error::NotJobOwner);
        }

        job.is_open = is_open;
        env.storage().persistent().set(&DataKey::Job(job_id), &job);
    }

    pub fn apply_to_job(
        env: Env,
        applicant: Address,
        job_id: u64,
        cover_letter: String,
        resume_link: String,
    ) -> u64 {
        applicant.require_auth();

        let job: Job = match env.storage().persistent().get(&DataKey::Job(job_id)) {
            Some(value) => value,
            None => panic_with_error!(&env, Error::JobNotFound),
        };

        if !job.is_open {
            panic_with_error!(&env, Error::JobClosed);
        }

        let existing_ids = read_u64_list_or_default(&env, &DataKey::JobApplicationIds(job_id));
        for application_id in existing_ids.iter() {
            let application: Application = match env
                .storage()
                .persistent()
                .get(&DataKey::Application(application_id))
            {
                Some(value) => value,
                None => continue,
            };

            if application.applicant == applicant {
                panic_with_error!(&env, Error::AlreadyApplied);
            }
        }

        let application_id = next_application_id(&env);
        let application = Application {
            id: application_id,
            job_id,
            applicant: applicant.clone(),
            cover_letter,
            resume_link,
            status: ApplicationStatus::Pending,
            applied_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Application(application_id), &application);

        let mut job_applications = existing_ids;
        job_applications.push_back(application_id);
        env.storage()
            .persistent()
            .set(&DataKey::JobApplicationIds(job_id), &job_applications);

        let applicant_key = DataKey::ApplicantApplicationIds(applicant);
        let mut applicant_applications = read_u64_list_or_default(&env, &applicant_key);
        applicant_applications.push_back(application_id);
        env.storage()
            .persistent()
            .set(&applicant_key, &applicant_applications);

        application_id
    }

    pub fn get_application(env: Env, application_id: u64) -> Option<Application> {
        env.storage()
            .persistent()
            .get(&DataKey::Application(application_id))
    }

    pub fn set_application_status(
        env: Env,
        employer: Address,
        application_id: u64,
        status: ApplicationStatus,
    ) {
        employer.require_auth();

        let mut application: Application = match env
            .storage()
            .persistent()
            .get(&DataKey::Application(application_id))
        {
            Some(value) => value,
            None => panic_with_error!(&env, Error::ApplicationNotFound),
        };

        let job: Job = match env.storage().persistent().get(&DataKey::Job(application.job_id)) {
            Some(value) => value,
            None => panic_with_error!(&env, Error::JobNotFound),
        };

        if job.employer != employer {
            panic_with_error!(&env, Error::NotJobOwner);
        }

        application.status = status;
        env.storage()
            .persistent()
            .set(&DataKey::Application(application_id), &application);
    }

    pub fn list_job_application_ids(env: Env, job_id: u64) -> Vec<u64> {
        read_u64_list_or_default(&env, &DataKey::JobApplicationIds(job_id))
    }

    pub fn list_applicant_application_ids(env: Env, applicant: Address) -> Vec<u64> {
        read_u64_list_or_default(&env, &DataKey::ApplicantApplicationIds(applicant))
    }
}

fn next_job_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .persistent()
        .get(&DataKey::NextJobId)
        .unwrap_or(1);
    env.storage().persistent().set(&DataKey::NextJobId, &(id + 1));
    id
}

fn next_application_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .persistent()
        .get(&DataKey::NextApplicationId)
        .unwrap_or(1);
    env.storage()
        .persistent()
        .set(&DataKey::NextApplicationId, &(id + 1));
    id
}

fn read_u64_list_or_default(env: &Env, key: &DataKey) -> Vec<u64> {
    env.storage().persistent().get(key).unwrap_or(vec![env])
}

mod test;
