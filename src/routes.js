const express = require('express');
const { getContracts, getContractsById } = require('./controllers/contracts');
const { getAllUnpaidJobs, postPayJob } = require('./controllers/jobs');
const { postDepositToUser } = require('./controllers/balances');
const { getBestClients, getBestProfession } = require('./controllers/admin');
const { getProfile } = require('./middleware/getProfile');

const router = express.Router();

router.get('/contracts', getProfile, getContracts);
router.get('/contracts/:id', getProfile, getContractsById);

router.get('/jobs/unpaid', getProfile, getAllUnpaidJobs);
router.post('/jobs/:job_id/pay', getProfile, postPayJob);

router.post('/balances/deposit/:userId', postDepositToUser);

router.get('/admin/best-profession', getBestProfession);
router.get('/admin/best-clients', getBestClients);

module.exports = router;
