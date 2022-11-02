const {Contract, Job} = require('./model');
const { Op } = require('sequelize');

const getAllUnpaid = (profileId) => {
  return Job.findAll({
    where: {
      paid: null,
    }, 
    include: [
      {
        model: Contract,
        attributes: [],
        where: {
          status: {
            [Op.ne]: 'terminated',
          },
          [Op.or]: [
            { ContractorId: profileId },
            { ClientId: profileId },
          ],
        },
      },
    ],
  });
};

module.exports = {
  getAllUnpaid,
};
