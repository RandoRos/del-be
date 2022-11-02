const express = require('express');
const bodyParser = require('body-parser');
const { Op } = require('sequelize');

const {sequelize} = require('./model');
const {getProfile} = require('./middleware/getProfile');
const {getAllUnpaid} = require('./queries');

const app = express();

app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

/**
 * @returns contract by id
 */
app.get('/contracts/:id',getProfile ,async (req, res) => {
  const {Contract} = req.app.get('models');
  const {id} = req.params;
  const contract = await Contract.findOne({
    where: {
      [Op.and]: [
        { id },
        {
          [Op.or]: [
            { ContractorId: req.profile.id },
            { ClientId: req.profile.id },
          ],
        },
      ],
    } });
  if (!contract) return res.status(404).end();
  res.json(contract);
});

/**
 * @returns all contracts by user
 */
app.get('/contracts', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models');
  const contracts = await Contract.findAll({
    where: {
      [Op.or]: [
        { ContractorId: req.profile.id },
        { ClientId: req.profile.id },
      ],
    },
  });
  if (!contracts) return res.status(404).end();
  res.json(contracts);
});

/**
 * @returns all active jobs
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const result = await getAllUnpaid(req.profile.id);
  res.json(result);
});

app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
  const {job_id: jobId} = req.params;
  const { Profile, Job } = req.app.get('models');

  const jobs = await getAllUnpaid(req.profile.id);
  const job = jobs.find(j => j.id === Number(jobId));

  if (!job) {
    res.status(404).end();
  }

  if (req.profile.balance < job.price) {
    res.status(201).send('Not enough money to pay');
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();
    await Profile.update({
      balance: req.profile.balance - job.price,
    }, { 
      where: {
        id: req.profile.id,
      },
      transaction,
    });
    
    await Job.update({
      paid: true,
    }, { 
      where: {
        id: jobId,
      },
      transaction,
    });

    await transaction.commit();
  } catch (err) {
    res.status(500).send(err);
    transaction.rollback();
  }

  res.send(job);
});

module.exports = app;
