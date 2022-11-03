const { getUserContractById, getAllUserContracts } = require('../db/queries');

/**
 * @returns user contract by id
 */
const getContractsById = async (req, res) => {
  const { id } = req.params;
  const contract = await getUserContractById(req.profile.id, id);
  if (!contract) return res.status(404).end();
  res.json(contract);
};

/**
 * @returns all contracts by user
 */
const getContracts = async (req, res) => {
  const contracts = await getAllUserContracts(req.profile.id);
  if (!contracts) return res.status(404).end();
  res.json(contracts);
};

module.exports = {
  getContracts,
  getContractsById,
};
