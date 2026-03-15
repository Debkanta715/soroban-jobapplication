#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, vec, Address, Env, String};

#[test]
fn create_job_apply_and_update_status() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let applicant = Address::generate(&env);

    let job_id = client.create_job(
        &employer,
        &String::from_str(&env, "Rust Smart Contract Engineer"),
        &String::from_str(&env, "Build and audit Soroban contracts"),
        &String::from_str(&env, "Remote"),
        &vec![
            &env,
            String::from_str(&env, "Rust"),
            String::from_str(&env, "Soroban"),
        ],
        &4000,
        &8000,
    );

    let job = client.get_job(&job_id).unwrap();
    assert_eq!(job.id, 1);
    assert_eq!(job.is_open, true);

    let application_id = client.apply_to_job(
        &applicant,
        &job_id,
        &String::from_str(&env, "I ship production Rust and web3 projects."),
        &String::from_str(&env, "https://example.com/resume.pdf"),
    );

    let application = client.get_application(&application_id).unwrap();
    assert_eq!(application.id, 1);
    assert_eq!(application.job_id, job_id);

    client.set_application_status(&employer, &application_id, &ApplicationStatus::Accepted);

    let updated = client.get_application(&application_id).unwrap();
    match updated.status {
        ApplicationStatus::Accepted => {}
        _ => panic!("application status was not updated"),
    }

    let job_application_ids = client.list_job_application_ids(&job_id);
    assert_eq!(job_application_ids.len(), 1);
    assert_eq!(job_application_ids.get(0).unwrap(), application_id);

    let applicant_application_ids = client.list_applicant_application_ids(&applicant);
    assert_eq!(applicant_application_ids.len(), 1);
    assert_eq!(applicant_application_ids.get(0).unwrap(), application_id);
}

#[test]
#[should_panic]
fn cannot_apply_twice_to_same_job() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let applicant = Address::generate(&env);

    let job_id = client.create_job(
        &employer,
        &String::from_str(&env, "Backend Engineer"),
        &String::from_str(&env, "Work on smart contracts"),
        &String::from_str(&env, "Nairobi"),
        &vec![&env, String::from_str(&env, "Rust")],
        &2000,
        &5000,
    );

    client.apply_to_job(
        &applicant,
        &job_id,
        &String::from_str(&env, "First attempt"),
        &String::from_str(&env, "https://example.com/a.pdf"),
    );

    client.apply_to_job(
        &applicant,
        &job_id,
        &String::from_str(&env, "Second attempt"),
        &String::from_str(&env, "https://example.com/b.pdf"),
    );
}

#[test]
#[should_panic]
fn only_job_owner_can_change_status() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let attacker = Address::generate(&env);
    let applicant = Address::generate(&env);

    let job_id = client.create_job(
        &employer,
        &String::from_str(&env, "Smart Contract Intern"),
        &String::from_str(&env, "Build test contracts"),
        &String::from_str(&env, "Hybrid"),
        &vec![&env, String::from_str(&env, "Testing")],
        &500,
        &1200,
    );

    let application_id = client.apply_to_job(
        &applicant,
        &job_id,
        &String::from_str(&env, "I am ready to learn"),
        &String::from_str(&env, "https://example.com/cv.pdf"),
    );

    client.set_application_status(&attacker, &application_id, &ApplicationStatus::Rejected);
}
