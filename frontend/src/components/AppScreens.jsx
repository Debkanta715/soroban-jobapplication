import React from "react";

function JobCard({ job, onSelectJob }) {
  return (
    <button className="job-item-card" type="button" onClick={() => onSelectJob(job)}>
      <p className="job-company">{job.company}</p>
      <p className="job-role">{job.role}</p>
      <p className="job-meta">{job.location} · {job.salary}</p>
      <div className="tag-row">
        {job.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </button>
  );
}

export function HomeScreen({ homeData, userName, onOpenNotifications, onSelectJob, onSeeAllJobs, result, popularJobs, recentJobs }) {
  const popular = popularJobs?.length ? popularJobs : homeData.popularJobs;
  const recent = recentJobs?.length ? recentJobs : homeData.recentJobs;

  return (
    <>
      <div className="mobile-top-row">
        <div>
          <p className="mobile-greet">Hello {userName}</p>
          <h2 className="mobile-title">{homeData.heading}</h2>
        </div>
        <button className="icon-circle" onClick={onOpenNotifications}>Bell</button>
      </div>

      <div className="search-row">
        <input placeholder={homeData.searchPlaceholder} />
        <button className="filter-btn">Filters</button>
      </div>

      <div className="section-head">
        <h3>{homeData.popularTitle}</h3>
        <button type="button" className="inline-link" onClick={onSeeAllJobs}>See All</button>
      </div>
      {popular.map((job, index) => <JobCard key={`${job.company}-${job.role}-${index}`} job={{ ...job, id: job.id || index + 1 }} onSelectJob={onSelectJob} />)}

      <div className="section-head">
        <h3>{homeData.recentTitle}</h3>
        <button type="button" className="inline-link" onClick={onSeeAllJobs}>See All</button>
      </div>
      {recent.map((job, index) => <JobCard key={`${job.company}-${job.role}-${index}`} job={{ ...job, id: job.id || index + 1 }} onSelectJob={onSelectJob} />)}

      <pre className="mini-result">{result || "No backend action yet."}</pre>
    </>
  );
}

export function SearchScreen({ searchData, onOpenFilter, onSelectJob, onBack, searchQuery, onSearchChange, searchResults }) {
  return (
    <>
      <div className="mobile-top-row simple">
        <button className="icon-circle" onClick={onBack}>Back</button>
        <h2 className="mobile-title small">{searchData.title}</h2>
      </div>

      <div className="search-row">
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchData.placeholder}
        />
        <button className="filter-btn" onClick={onOpenFilter}>Filters</button>
      </div>

      <div className="section-head"><h3>Recent Search</h3></div>
      <div className="notice-list">
        {searchData.recentSearch.map((item) => (
          <div key={item} className="notice-item"><p>{item}</p></div>
        ))}
      </div>

      <div className="section-head"><h3>Recent View</h3></div>
      {(searchResults?.length ? searchResults : searchData.recentView).map((job, index) => (
        <JobCard key={`${job.company}-${job.role}-${index}`} job={{ ...job, id: job.id || index + 1 }} onSelectJob={onSelectJob} />
      ))}
    </>
  );
}

export function ApplyJobScreen({ selectedJob, applyForm, onApplyChange, onSubmitApply, onReadJob, loading, walletAddress, onConnectWallet, onWalletAddressChange, onUseManualWallet, onBack }) {
  return (
    <>
      <div className="mobile-top-row simple">
        <button className="icon-circle" onClick={onBack}>Back</button>
        <h2 className="mobile-title small">Job Application</h2>
      </div>

      <div className="apply-summary">
        <p className="job-company">{selectedJob?.company || "Selected Job"}</p>
        <p className="job-role">{selectedJob?.role || "Choose a job from Home/Search"}</p>
        <p className="job-meta">{selectedJob?.location || "Location"}</p>
      </div>

      <form className="auth-form" onSubmit={onSubmitApply}>
        <label>Job ID</label>
        <input value={applyForm.jobId} onChange={(e) => onApplyChange("jobId", e.target.value)} placeholder="Job ID" />

        <label>Connected Wallet</label>
        <div className="wallet-row">
          <input value={walletAddress} onChange={(e) => onWalletAddressChange(e.target.value)} placeholder="Paste Stellar address (G...)" />
          <button type="button" onClick={onConnectWallet}>Connect</button>
          <button type="button" className="secondary" onClick={onUseManualWallet}>Use Address</button>
        </div>

        <label>Cover Letter</label>
        <textarea className="full-desc" value={applyForm.coverLetter} onChange={(e) => onApplyChange("coverLetter", e.target.value)} placeholder="Write why you are a good fit..." />

        <label>Resume Link</label>
        <input value={applyForm.resumeLink} onChange={(e) => onApplyChange("resumeLink", e.target.value)} placeholder="https://..." />

        <div className="actions-row">
          <button type="button" className="secondary" onClick={onReadJob} disabled={loading || !applyForm.jobId}>
            Verify Job On-Chain
          </button>
          <button type="submit" className="primary-auth-btn" disabled={loading}>{loading ? "Submitting..." : "Submit Application"}</button>
        </div>
      </form>
    </>
  );
}

export function FilterScreen({ filterData, filterForm, onFilterChange, onBack, onResetFilter, onApplyFilter }) {
  return (
    <>
      <div className="mobile-top-row simple">
        <button className="icon-circle" onClick={onBack}>Back</button>
        <h2 className="mobile-title small">{filterData.title}</h2>
      </div>

      <div className="auth-form">
        <label>Location</label>
        <input value={filterForm.location} onChange={(e) => onFilterChange("location", e.target.value)} />
        <label>Sort By</label>
        <input value={filterForm.sortBy} onChange={(e) => onFilterChange("sortBy", e.target.value)} />
        <label>Job Nature</label>
        <input value={filterForm.jobNature} onChange={(e) => onFilterChange("jobNature", e.target.value)} />
        <label>Job Level</label>
        <div className="tag-row">{filterData.jobLevels.map((item) => <span key={item}>{item}</span>)}</div>
        <label>Working Model</label>
        <div className="tag-row">{filterData.workModes.map((item) => <span key={item}>{item}</span>)}</div>
        <label>Company</label>
        <div className="tag-row">{filterData.companies.map((item) => <span key={item}>{item}</span>)}</div>
        <label>Salary Range</label>
        <div className="salary-range-row">
          <input value={filterForm.salaryMin} onChange={(e) => onFilterChange("salaryMin", e.target.value)} />
          <input value={filterForm.salaryMax} onChange={(e) => onFilterChange("salaryMax", e.target.value)} />
        </div>
        <p className="status">${filterForm.salaryMin}.00 - ${filterForm.salaryMax}.00</p>
        <div className="actions-row">
          <button className="secondary" type="button" onClick={onResetFilter}>Reset Filter</button>
          <button type="button" onClick={onApplyFilter}>Apply Filter</button>
        </div>
      </div>
    </>
  );
}

export function NotificationsScreen({ notifications, onBack }) {
  return (
    <>
      <div className="mobile-top-row simple">
        <button className="icon-circle" onClick={onBack}>Back</button>
        <h2 className="mobile-title small">Notification</h2>
      </div>
      <h3>Today</h3>
      <div className="notice-list">
        {notifications.map((item, index) => (
          <div key={`${item.title}-${index}`} className="notice-item">
            <p>{item.title}</p>
            <small>{item.time}</small>
          </div>
        ))}
      </div>
    </>
  );
}

export function PostJobScreen({ postData, postForm, onPostChange, onSubmitPost, loading, onBack }) {
  return (
    <>
      <div className="mobile-top-row simple">
        <button className="icon-circle" onClick={onBack}>Back</button>
        <h2 className="mobile-title small">{postData.title}</h2>
      </div>

      <form className="auth-form" onSubmit={onSubmitPost}>
        <label>Job Title</label>
        <input placeholder="Write A Title" value={postForm.title} onChange={(e) => onPostChange("title", e.target.value)} />
        <label>Job Nature</label>
        <input placeholder="Select Job Type" value={postForm.nature} onChange={(e) => onPostChange("nature", e.target.value)} />
        <label>Location</label>
        <input placeholder="Select A Country" value={postForm.location} onChange={(e) => onPostChange("location", e.target.value)} />
        <label>Experience Level</label>
        <input placeholder="Select An Experience" value={postForm.experience} onChange={(e) => onPostChange("experience", e.target.value)} />
        <label>Job Level</label>
        <input placeholder="Select A Job Level" value={postForm.level} onChange={(e) => onPostChange("level", e.target.value)} />
        <label>Working Model</label>
        <input placeholder="Select Working Model" value={postForm.model} onChange={(e) => onPostChange("model", e.target.value)} />
        <label>Salary</label>
        <input placeholder="Amount Of Salary" value={postForm.salary} onChange={(e) => onPostChange("salary", e.target.value)} />
        <label>Full Description</label>
        <textarea className="full-desc" placeholder="Write A Description..." value={postForm.description} onChange={(e) => onPostChange("description", e.target.value)} />
        <button type="submit" className="primary-auth-btn" disabled={loading}>{loading ? "Posting..." : postData.postButtonLabel}</button>
      </form>
    </>
  );
}

export function ProfileScreen({ user, walletStatus, walletAddress, onConnectWallet, onWalletAddressChange, onUseManualWallet, onCheckApi, loading, onLogout, onBack }) {
  return (
    <>
      <div className="mobile-top-row simple">
        <button className="icon-circle" onClick={onBack}>Back</button>
        <h2 className="mobile-title small">Profile</h2>
      </div>
      <div className="profile-card">
        <p className="status">Name: {user.name}</p>
        <p className="status">Email: {user.email || "No email yet"}</p>
        <p className="status">Wallet: {walletStatus}</p>
        <input value={walletAddress} onChange={(e) => onWalletAddressChange(e.target.value)} placeholder="Paste Stellar address (G...)" />
      </div>
      <div className="actions-row">
        <button onClick={onConnectWallet} disabled={loading}>Connect Wallet</button>
        <button className="secondary" onClick={onUseManualWallet} disabled={loading}>Use Pasted Address</button>
        <button className="secondary" onClick={onCheckApi} disabled={loading}>Check API</button>
        <button onClick={onLogout}>Logout</button>
      </div>
    </>
  );
}

export function BottomNav({ tab, onTabChange }) {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "search", label: "Search" },
    { id: "filter", label: "Filter" },
    { id: "apply", label: "Apply" },
    { id: "notifications", label: "Notify" },
    { id: "post", label: "Post" },
    { id: "profile", label: "Profile" }
  ];

  return (
    <div className="bottom-nav bottom-nav-wide">
      {tabs.map((item) => (
        <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => onTabChange(item.id)}>{item.label}</button>
      ))}
    </div>
  );
}
