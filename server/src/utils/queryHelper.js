const isMongoObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

const getInspectionQuery = (id) => {
  if (!id) return { _id: null };
  return isMongoObjectId(id) ? { $or: [{ _id: id }, { inspectionId: id }] } : { inspectionId: id };
};

const getRuleQuery = (id) => {
  if (!id) return { _id: null };
  return isMongoObjectId(id) ? { $or: [{ _id: id }, { ruleId: id }] } : { ruleId: id };
};

const getFindingQuery = (id) => {
  if (!id) return { _id: null };
  return isMongoObjectId(id) ? { $or: [{ _id: id }, { ruleId: id }] } : { ruleId: id };
};

module.exports = {
  isMongoObjectId,
  getInspectionQuery,
  getRuleQuery,
  getFindingQuery,
};
