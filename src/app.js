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
  const { Profile, Job, Contract } = req.app.get('models');

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

        await Profile.update({
          balance: req.profile.balance - job.price,
        }, { 
          where: {
            id: contract.ClientId,
          },
          transaction,
        });
  
        await Profile.update({
          balance: contractor + job.price,
        }, { 
          where: {
            id: contract.ContractorId,
          },
          transaction,
        });
        
        await Job.update({
          paid: true,
          paymentDate: new Date(),
        }, { 
          where: {
            id: jobId,
          },
          transaction,
        });
    
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
});

app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
  const {userId} = req.params;
  const { Profile, Job, Contract } = req.app.get('models');

  if (req.profile.type === 'client') {
    const jobs = await Job.findAll({
      attributes: [
        [sequelize.fn('sum',sequelize.col('price')), 'total'],
      ],
      include: [
        {
          model: Contract,
          attributes: [],
          where: {
            clientId: req.profile.id,
          },
        },
      ],
      where: {
        paid: null,
      },
      raw: true,
    });

    await Profile.update({
      balance: req.profile.balance + Math.floor(jobs[0].total * 0.25),
    }, {
      where: {
        id: req.profile.id,
      },
    });

    res.send(req.profile);
  }

  res.end();
});

app.get('/admin/best-profession', async (req, res) => {
  const { start, end } = req.query;
  const { Profile, Job, Contract } = req.app.get('models');

  try {
    const result = await Contract.findAll({
      attributes: [
        'ContractorId',
        [sequelize.fn('sum',sequelize.col('price')), 'total'],
      ],
      include: [
        { 
          model: Job,
          where: { 
            [Op.and]: {
              paid: true,
              createdAt: {
                [Op.gt]: new Date(start),
                [Op.lt]: new Date(end),
              },
            },
          },
          attributes: [],
        },
      ],
      group: [
        'ContractorId',
      ],
      order: [
        ['total', 'DESC'],
      ],
    });

    const top = await Profile.findOne({ where: { id: result[0].ContractorId }});
    res.send(top.profession);
  } catch (err) {
    res.send({});
  }
});

module.exports = app;
