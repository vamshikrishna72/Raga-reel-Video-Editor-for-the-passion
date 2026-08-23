const fs = require('fs');
const path = require('path');

// In-Memory & File-backed Job Store for Asynchronous Video Worker Processing
class JobQueueManager {
  constructor() {
    this.jobs = new Map();
    this.jobsDir = path.join(__dirname, 'uploads', 'jobs');
    if (!fs.existsSync(this.jobsDir)) {
      fs.mkdirSync(this.jobsDir, { recursive: true });
    }
  }

  createJob(type = 'create_reel', metadata = {}) {
    const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const job = {
      jobId,
      type,
      status: 'QUEUED',
      progress: 0,
      currentStage: 'QUEUED',
      stageMessage: 'Job accepted and queued for background worker...',
      metadata,
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cancelled: false
    };

    this.jobs.set(jobId, job);
    this.saveJobDisk(job);
    return job;
  }

  updateJob(jobId, updates = {}) {
    let job = this.jobs.get(jobId);
    if (!job) {
      job = this.loadJobDisk(jobId);
    }
    if (!job) return null;

    Object.assign(job, updates, { updatedAt: new Date().toISOString() });
    this.jobs.set(jobId, job);
    this.saveJobDisk(job);
    return job;
  }

  getJob(jobId) {
    if (this.jobs.has(jobId)) {
      return this.jobs.get(jobId);
    }
    return this.loadJobDisk(jobId);
  }

  cancelJob(jobId) {
    const job = this.getJob(jobId);
    if (!job) return false;
    if (job.status === 'COMPLETED' || job.status === 'FAILED') return false;

    this.updateJob(jobId, {
      status: 'CANCELLED',
      currentStage: 'CANCELLED',
      stageMessage: 'Job cancelled by user',
      cancelled: true
    });
    return true;
  }

  saveJobDisk(job) {
    try {
      const filePath = path.join(this.jobsDir, `${job.jobId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(job, null, 2));
    } catch (e) {
      console.warn(`Failed to save job ${job.jobId} to disk:`, e.message);
    }
  }

  loadJobDisk(jobId) {
    try {
      const filePath = path.join(this.jobsDir, `${jobId}.json`);
      if (fs.existsSync(filePath)) {
        const job = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.jobs.set(jobId, job);
        return job;
      }
    } catch (e) {}
    return null;
  }
}

const jobQueue = new JobQueueManager();
module.exports = { jobQueue };
