/**
 * Tektwig Recruitment Portal - Local IndexedDB Manager
 */

const DB_NAME = 'TektwigRecruitmentDB';
const DB_VERSION = 4;

/**
 * Cached database connection — opened once and reused across all operations.
 * Avoids re-opening IndexedDB and re-running seed checks on every single call.
 */
let _dbInstance = null;
let _dbInitPromise = null;

/**
 * Initializes the database.
 * Returns a promise that resolves with the (cached) database object.
 */
function initDB() {
  // If we already have a live connection, reuse it
  if (_dbInstance) {
    return Promise.resolve(_dbInstance);
  }

  // If initialization is already in progress, wait for it
  if (_dbInitPromise) {
    return _dbInitPromise;
  }

  _dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      _dbInitPromise = null;
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      // Handle unexpected connection close (e.g. browser GC)
      db.onclose = () => {
        _dbInstance = null;
        _dbInitPromise = null;
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for job postings
      if (!db.objectStoreNames.contains('jobs')) {
        db.createObjectStore('jobs', { keyPath: 'id', autoIncrement: true });
      }
      
      // Store for job applications
      if (!db.objectStoreNames.contains('applications')) {
        const appStore = db.createObjectStore('applications', { keyPath: 'id', autoIncrement: true });
        appStore.createIndex('jobId', 'jobId', { unique: false });
        appStore.createIndex('status', 'status', { unique: false });
      }

      // Store for enterprise recruitment leads (v2)
      if (!db.objectStoreNames.contains('enterpriseLeads')) {
        const leadStore = db.createObjectStore('enterpriseLeads', { keyPath: 'id', autoIncrement: true });
        leadStore.createIndex('status', 'status', { unique: false });
        leadStore.createIndex('refId', 'refId', { unique: true });
      }

      // Store for enterprise job applications (v3)
      if (!db.objectStoreNames.contains('enterpriseApplications')) {
        const entAppStore = db.createObjectStore('enterpriseApplications', { keyPath: 'id', autoIncrement: true });
        entAppStore.createIndex('leadRefId', 'leadRefId', { unique: false });
        entAppStore.createIndex('status', 'status', { unique: false });
      }

      // Store for website contact inquiries (v4)
      if (!db.objectStoreNames.contains('contactInquiries')) {
        const inquiryStore = db.createObjectStore('contactInquiries', { keyPath: 'id', autoIncrement: true });
        inquiryStore.createIndex('submittedAt', 'submittedAt', { unique: false });
      }
    };
  }).then(async (db) => {
    // Seed initial data if stores are empty (runs only once)
    await seedInitialData(db);
    _dbInstance = db;
    return db;
  }).catch(err => {
    _dbInitPromise = null;
    throw err;
  });

  return _dbInitPromise;
}

/**
 * Seeds initial jobs and mock applications if they do not already exist.
 */
async function seedInitialData(db) {
  const jobCount = await countRecords(db, 'jobs');
  if (jobCount === 0) {
    const initialJobs = [
      {
        id: 1,
        title: 'Cybersecurity Specialist',
        department: 'Security',
        type: 'Full-time',
        location: 'Lagos / Remote',
        experience: '3+ Years',
        salary: 'Competitive',
        description: 'We are seeking a highly skilled Cybersecurity Specialist to lead risk assessments, penetration testing, and implementation of robust data protection compliance models for our enterprise clients.',
        requirements: [
          'Strong understanding of GDPR, NDPR, ISO 27001 standard compliance.',
          'Experience in network security, intrusion detection systems, and threat vulnerability auditing.',
          'Relevant industry certifications (CEH, CISSP, CompTIA Security+) is a plus.',
          'Hands-on expertise in setting up database encryption and access controls.'
        ],
        status: 'Active',
        createdAt: new Date('2026-06-15T08:00:00Z').toISOString()
      },
      {
        id: 2,
        title: 'Full-Stack Software Engineer',
        department: 'Software Dev',
        type: 'Full-time',
        location: 'Lagos / Hybrid',
        experience: '2+ Years',
        salary: 'Competitive',
        description: 'Join our software engineering team to design, build, and maintain premium web and mobile solutions. You will work on API integrations, microservices, and custom client dashboards.',
        requirements: [
          'Proficiency in Javascript, HTML5, CSS3, and modern framework ecosystems (Node, React/Vue).',
          'Good knowledge of relational and non-relational database design (PostgreSQL, MongoDB).',
          'Familiarity with containerization (Docker) and basic CI/CD pipeline automation.',
          'Ability to write clean, secure, and documented APIs.'
        ],
        status: 'Active',
        createdAt: new Date('2026-06-18T09:30:00Z').toISOString()
      },
      {
        id: 3,
        title: 'AI & Data Pipeline Engineer',
        department: 'AI & Analytics',
        type: 'Full-time',
        location: 'Remote',
        experience: '4+ Years',
        salary: 'Competitive',
        description: 'Tektwig is looking for an AI & Data Pipeline Engineer to construct data engineering pipelines (ETL/ELT), implement machine learning algorithms, and build interactive intelligence panels.',
        requirements: [
          'Strong experience in Python, Pandas, NumPy, and Scikit-Learn/TensorFlow.',
          'Proficiency with SQL and data lake/warehouse concepts.',
          'Experience deploying machine learning models into production environments.',
          'Familiarity with cloud-based analytics dashboards and telemetry data streams.'
        ],
        status: 'Active',
        createdAt: new Date('2026-06-20T11:00:00Z').toISOString()
      },
      {
        id: 4,
        title: 'Network Infrastructure Architect',
        department: 'Networking',
        type: 'Full-time',
        location: 'Lagos',
        experience: '5+ Years',
        salary: 'Competitive',
        description: 'We require a Senior Network Architect to design topology vectors, configure high-availability cloud clusters, virtualize SD-WAN routing, and troubleshoot complex routing interfaces.',
        requirements: [
          'Expertise in Cisco, Juniper, or Huawei networking infrastructure.',
          'Strong skills in cloud architectures (AWS, Azure, or private cloud environments).',
          'Familiarity with network security protocols, firewalls, and secure site-to-site VPNs.',
          'CCNP/CCIE or equivalent certification is highly desired.'
        ],
        status: 'Active',
        createdAt: new Date('2026-06-22T14:00:00Z').toISOString()
      },
      {
        id: 5,
        title: 'IT Technical Trainer',
        department: 'Training',
        type: 'Contract',
        location: 'Hybrid',
        experience: '3+ Years',
        salary: 'Negotiable',
        description: 'Deliver structured technical training bootcamps, cybersecurity simulation exercises, and coding labs for our corporate clients.',
        requirements: [
          'Excellent communication skills and passion for teaching technology concepts.',
          'Solid engineering background in software development or network security.',
          'Experience building instructional materials, presentations, and lab worksheets.',
          'Prior coaching, lecturing, or corporate training experience.'
        ],
        status: 'Active',
        createdAt: new Date('2026-06-25T10:15:00Z').toISOString()
      }
    ];

    for (const job of initialJobs) {
      await addRecord(db, 'jobs', job);
    }
    console.log('Seeded initial job roles successfully.');
  }

  const appCount = await countRecords(db, 'applications');
  if (appCount === 0) {
    // Generate mock text-based resumes
    const mockResume1 = new Blob(
      [
        'Jane Doe - Resume\n\nContact: jane.doe@example.com | +234 812 345 6789\nGithub: github.com/janedoe\n\nExperience:\n- Senior Frontend Engineer at TechSolutions (2 years)\n- Web Developer at DevCorp (1 year)\n\nSkills: Javascript, React, CSS, Node.js, Git\n\nEducation: B.Sc. Computer Science'
      ],
      { type: 'text/plain' }
    );
    
    const mockResume2 = new Blob(
      [
        'Mark Vance - Resume\n\nContact: mark.vance@example.com | +234 908 765 4321\nLinkedIn: linkedin.com/in/markvance\n\nExperience:\n- Cyber Security Auditor at SafeNet (4 years)\n- Network Admin at SecureIT (1 year)\n\nSkills: Penetration Testing, Kali Linux, ISO 27001, Firewall Config\n\nEducation: B.Eng. Electrical Engineering'
      ],
      { type: 'text/plain' }
    );

    const mockResume3 = new Blob(
      [
        'Sarah Jenkins - Resume\n\nContact: sarah.j@example.com | +234 803 111 2222\nPortfolio: sarahj.dev\n\nExperience:\n- Data Engineer at AnalyticsHub (5 years)\n- Python Developer at ML-Lab (1 year)\n\nSkills: Python, TensorFlow, SQL, AWS, Airflow, Spark\n\nEducation: M.Sc. Data Science'
      ],
      { type: 'text/plain' }
    );

    const initialApps = [
      {
        id: 1,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+234 812 345 6789',
        jobId: 2, // Full-Stack Software Engineer
        jobTitle: 'Full-Stack Software Engineer',
        experience: 3,
        portfolio: 'https://github.com/janedoe',
        coverLetter: 'Dear hiring team, I am incredibly excited about the Full-Stack Software Engineer role at Tektwig. I have built several responsive dashboards using React and Node.js. My focus is always on secure, performant, and clean code that scales. I look forward to hearing from you.',
        cvFile: mockResume1,
        cvFileName: 'jane_doe_resume.txt',
        cvFileType: 'text/plain',
        status: 'Reviewing',
        appliedAt: new Date('2026-07-05T10:30:00Z').toISOString()
      },
      {
        id: 2,
        name: 'Mark Vance',
        email: 'mark.vance@example.com',
        phone: '+234 908 765 4321',
        jobId: 1, // Cybersecurity Specialist
        jobTitle: 'Cybersecurity Specialist',
        experience: 5,
        portfolio: 'https://linkedin.com/in/markvance',
        coverLetter: 'Hello, I write to apply for the Cybersecurity Specialist position. Having worked in network vulnerability auditing for over four years, I specialize in identifying weak vectors and designing cryptographic controls to protect internal databases. I would love to join the team.',
        cvFile: mockResume2,
        cvFileName: 'mark_vance_resume.txt',
        cvFileType: 'text/plain',
        status: 'Interviewing',
        appliedAt: new Date('2026-07-04T14:15:00Z').toISOString()
      },
      {
        id: 3,
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        phone: '+234 803 111 2222',
        jobId: 3, // AI & Data Pipeline Engineer
        jobTitle: 'AI & Data Pipeline Engineer',
        experience: 6,
        portfolio: 'https://sarahj.dev',
        coverLetter: 'To the Recruiting Coordinator, I am applying for the AI & Data Pipeline Engineer position. I have designed massive data lakes on AWS and have automated complex ETL workflows for analytical applications. I have solid mathematical backgrounds in supervised and unsupervised learning algorithms.',
        cvFile: mockResume3,
        cvFileName: 'sarah_jenkins_resume.txt',
        cvFileType: 'text/plain',
        status: 'Offered',
        appliedAt: new Date('2026-07-06T09:00:00Z').toISOString()
      }
    ];

    for (const app of initialApps) {
      await addRecord(db, 'applications', app);
    }
    console.log('Seeded initial job applications successfully.');
  }
}

/* ==========================================================================
   Helper IndexedDB promises
   ========================================================================== */

function countRecords(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function addRecord(db, storeName, record) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(record);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function putRecord(db, storeName, record) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(record);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllRecords(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getRecordById(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteRecord(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/* ==========================================================================
   Public DB Operations API (exported to window object)
   ========================================================================== */

window.TektwigDB = {
  getJobs: async () => {
    const db = await initDB();
    return getAllRecords(db, 'jobs');
  },
  
  getJob: async (id) => {
    const db = await initDB();
    return getRecordById(db, 'jobs', parseInt(id));
  },
  
  addJob: async (job) => {
    const db = await initDB();
    if (!job.createdAt) job.createdAt = new Date().toISOString();
    return addRecord(db, 'jobs', job);
  },

  updateJob: async (job) => {
    const db = await initDB();
    return putRecord(db, 'jobs', job);
  },

  deleteJob: async (id) => {
    const db = await initDB();
    return deleteRecord(db, 'jobs', parseInt(id));
  },

  getApplications: async () => {
    const db = await initDB();
    return getAllRecords(db, 'applications');
  },

  getApplication: async (id) => {
    const db = await initDB();
    return getRecordById(db, 'applications', parseInt(id));
  },

  saveApplication: async (appData) => {
    const db = await initDB();
    if (!appData.appliedAt) appData.appliedAt = new Date().toISOString();
    if (!appData.status) appData.status = 'Pending Review';
    if (appData.isThirdParty) {
      return addRecord(db, 'enterpriseApplications', appData);
    }
    return addRecord(db, 'applications', appData);
  },

  updateApplicationStatus: async (id, newStatus) => {
    const db = await initDB();
    const app = await getRecordById(db, 'applications', parseInt(id));
    if (!app) throw new Error(`Application with ID ${id} not found.`);
    app.status = newStatus;
    return putRecord(db, 'applications', app);
  },

  deleteApplication: async (id) => {
    const db = await initDB();
    return deleteRecord(db, 'applications', parseInt(id));
  },

  // ── Enterprise Applications ────────────────────────────────────────────────
  getEnterpriseApplications: async () => {
    const db = await initDB();
    return getAllRecords(db, 'enterpriseApplications');
  },

  getEnterpriseApplicationsForLead: async (leadRefId) => {
    const db = await initDB();
    const allEntApps = await getAllRecords(db, 'enterpriseApplications');
    return allEntApps.filter(app => app.leadRefId === leadRefId);
  },

  getEnterpriseApplication: async (id) => {
    const db = await initDB();
    return getRecordById(db, 'enterpriseApplications', parseInt(id));
  },

  updateEnterpriseApplicationStatus: async (id, newStatus) => {
    const db = await initDB();
    const app = await getRecordById(db, 'enterpriseApplications', parseInt(id));
    if (!app) throw new Error(`Enterprise application with ID ${id} not found.`);
    app.status = newStatus;
    return putRecord(db, 'enterpriseApplications', app);
  },

  deleteEnterpriseApplication: async (id) => {
    const db = await initDB();
    return deleteRecord(db, 'enterpriseApplications', parseInt(id));
  },

  // ── Enterprise Leads ──────────────────────────────────────────────────────
  getEnterpriseLeads: async () => {
    const db = await initDB();
    return getAllRecords(db, 'enterpriseLeads');
  },

  getEnterpriseLead: async (id) => {
    const db = await initDB();
    return getRecordById(db, 'enterpriseLeads', parseInt(id));
  },

  saveEnterpriseLead: async (leadData) => {
    const db = await initDB();
    if (!leadData.submittedAt) leadData.submittedAt = new Date().toISOString();
    if (!leadData.status) leadData.status = 'New';
    return addRecord(db, 'enterpriseLeads', leadData);
  },

  updateEnterpriseLead: async (leadData) => {
    const db = await initDB();
    return putRecord(db, 'enterpriseLeads', leadData);
  },

  updateLeadStatus: async (id, newStatus) => {
    const db = await initDB();
    const lead = await getRecordById(db, 'enterpriseLeads', parseInt(id));
    if (!lead) throw new Error(`Enterprise lead with ID ${id} not found.`);
    lead.status = newStatus;
    return putRecord(db, 'enterpriseLeads', lead);
  },

  deleteEnterpriseLead: async (id) => {
    const db = await initDB();
    return deleteRecord(db, 'enterpriseLeads', parseInt(id));
  },

  // ── Contact Inquiries ─────────────────────────────────────────────────────
  saveContactInquiry: async (inquiryData) => {
    const db = await initDB();
    if (!inquiryData.submittedAt) inquiryData.submittedAt = new Date().toISOString();
    return addRecord(db, 'contactInquiries', inquiryData);
  },

  getContactInquiries: async () => {
    const db = await initDB();
    return getAllRecords(db, 'contactInquiries');
  },

  deleteContactInquiry: async (id) => {
    const db = await initDB();
    return deleteRecord(db, 'contactInquiries', parseInt(id));
  }
};
