const { getAllUnpaid, updateProfileBalance, updateJob } = require('../db/queries');

/**
 * @returns all user active but unpaid jobs
 */
const getAllUnpaidJobs = async (req, res) => {
  try {
    const result = await getAllUnpaid(req.profile.id);
    res.json(result);
  } catch (err) {
    res.status(500).send('Something went wrong!');
  }
};

/**
 * client can initiate the pay for the designated job
 */
const postPayJob = async (req, res) => {
  const { job_id: jobId } = req.params;
  const { Profile, Contract } = req.app.get('models');
  const sequelize = req.app.get('sequelize');

  if (req.profile.type === 'client') {
    const jobs = await getAllUnpaid(req.profile.id);
    const job = jobs.find(j => j.id === Number(jobId));
  
    if (!job) {
      res.status(404).end();
    }
  
    if (req.profile.balance >= job.price) {
      let transaction;
      try {
        transaction = await sequelize.transaction();
        const contract = await Contract.findOne({ where: { id: job.ContractId }});
        const contractor = await Profile.findOne({ where: { id: contract.ContractorId } });

        await updateProfileBalance(contract.ClientId, req.profile.balance - job.price, transaction);
        await updateProfileBalance(contract.ContractorId, contractor + job.price, transaction);
        
        await updateJob(jobId, { paid: true, paymentDate: new Date()}, transaction);    
        await transaction.commit();
        res.send('Done');
      } catch (err) {
        res.status(500).send('Something went wrong!');
        transaction.rollback();
      }
    } else {
      res.status(200).send('Not enough money to pay');
    }
  }

  res.end();
};

module.exports = {
  getAllUnpaidJobs,
  postPayJob,
};
