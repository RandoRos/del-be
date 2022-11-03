const { Op } = require('sequelize');

/**
 * @return profession (contractor) who made most money
 */
const getBestProfession = async (req, res) => {
  const { start, end } = req.query;
  const { Profile, Job, Contract } = req.app.get('models');
  const sequelize = req.app.get('sequelize');

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
};

/**
 * @return top paid clients
 */
const getBestClients = async (req, res) => {
  const { start, end, limit = 2 } = req.query;
  const { Profile, Job, Contract } = req.app.get('models');
  const sequelize = req.app.get('sequelize');

  try {
    const result = await Contract.findAll({
      attributes: [
        'ClientId',
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
        'ClientId',
      ],
      order: [
        ['total', 'DESC'],
      ],
      raw: true,
    });

    const ids = result.map(e => e.ClientId);
    const profiles = await Profile.findAll({
      limit,
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      attributes: ['id', 'firstName', 'lastName'],
    });

    const bestClients = profiles.map(p => (
      {
        id: p.id,
        fullName: `${p.firstName} ${p.lastName}`,
        paid: result.find(e => e.ClientId === p.id).total,
      }
    ))
      .sort((a,b) => b.paid - a.paid);

    res.send(bestClients);
  } catch (err) {
    res.send({});
  }
};

module.exports = {
  getBestProfession,
  getBestClients,
};
