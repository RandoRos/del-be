const express = require('express');
const bodyParser = require('body-parser');
const { Op } = require('sequelize');

const {sequelize} = require('./model');
const {getProfile} = require('./middleware/getProfile');

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
  const { Contract, Job } = req.app.get('models');

  Contract.findAll({
    attributes: [],
    where: {
      status: {
        [Op.ne]: 'terminated',
      },
      [Op.or]: [
        { ContractorId: req.profile.id },
        { ClientId: req.profile.id },
      ],
    },
    include: [
      { model: Job },
    ],
  }).then(result => {
    res.json(
      result
        .filter(e => e.Jobs.length)
        .reduce((acc, item) => acc.concat(item.Jobs), []),
    );
  });
});

module.exports = app;
