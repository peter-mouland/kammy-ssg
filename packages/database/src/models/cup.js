import mongoose from 'mongoose';
import format from 'date-fns/format';

const Cup = mongoose.model('Cup');

const getCupTeam = (cupTeamDetails = {}) => Cup.aggregate([{ $match: cupTeamDetails }]).exec();

// todo: test merge!
// findOneAndUpdate
const saveCupTeam = async ({ cupTeamInput: team } = {}) => {
  try {
    const teamWithTime = { ...team, timestamp: format(new Date(), 'DD/MM/YYYY HH:mm:ss') };
    const dbCupTeam = await getCupTeam({ manager: team.manager, group: team.group, round: team.round });
    return (!dbCupTeam.length)
      ? new Cup(team).save()
      : Cup.findOneAndUpdate(dbCupTeam[0]._id, { ...dbCupTeam, ...teamWithTime }).exec().catch(console.error);
  } catch (e) {
    console.error(e);
    return {};
  }
};

const getDraftCup = async () => {
  try {
    return await getCupTeam();
  } catch (e) {
    console.error(e);
    return {};
  }
};

// eslint-disable-next-line import/prefer-default-export
export { saveCupTeam, getDraftCup };
