const { updateProfileBalance } = require('../db/queries');

/**
 * make deposit to designated user, but not more than 25% of it unpaid jobs
 */
const postDepositToUser = async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  const { Profile, Job, Contract } = req.app.get('models');
  const sequelize = req.app.get('sequelize');

  const user = await Profile.findOne({
    where: {
      id: userId,
    },
  });

  if (user && user.type !== 'client') {
    res.status(404).end();
  }

  const jobs = await Job.findAll({
    attributes: [
      [sequelize.fn('sum',sequelize.col('price')), 'total'],
    ],
    include: [
      {
        model: Contract,
        attributes: [],
        where: {
          clientId: user.id,
        },
      },
    ],
    where: {
      paid: null,
    },
    raw: true,
  });

  if (jobs[0].total * 0.25 > amount) {
    await updateProfileBalance(user.id, user.balance + amount);
    res.send('success');
  } else {
    res.send('This amount cannot be deposited');
  }
};

module.exports = {
  postDepositToUser,
};
