const { Contract, Job, Profile } = require('../model');
const { Op } = require('sequelize');

const getUserContractById = (userId, contractId) => {
  return Contract.findOne({
    where: {
      [Op.and]: [
        {id: contractId },
        {
          [Op.or]: [
            { ContractorId: userId },
            { ClientId: userId },
          ],
        },
      ],
    },
  });
};

const getAllUserContracts = userId => {
  return Contract.findAll({
    where: {
      [Op.or]: [
        { ContractorId: userId },
        { ClientId: userId },
      ],
    },
  },
  );
};

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

const updateProfileBalance = (userId, balance, transaction) => {
  return Profile.update({
    balance,
  }, { 
    where: {
      id: userId,
    },
    transaction,
  });
};

const updateJob = (jobId, fields, transaction) => {
  return Job.update(
    { ...fields }, { 
      where: {
        id: jobId,
      },
      transaction,
    });
};

module.exports = {
  getUserContractById,
  getAllUserContracts,
  getAllUnpaid,
  updateProfileBalance,
  updateJob,
};
