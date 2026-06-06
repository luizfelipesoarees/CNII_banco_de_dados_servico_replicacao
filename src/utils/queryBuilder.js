export function buildQueryOptions(options, groupName) {
  const { page = 1, size = 10, orderBy, filtrarGrupo } = options || {};
  
  const take = parseInt(size, 10);
  const skip = (parseInt(page, 10) - 1) * take;
  
  const query = {
    take: isNaN(take) ? 10 : take,
    skip: isNaN(skip) ? 0 : skip,
  };

  if (orderBy) {
    const [field, direction] = orderBy.split(',');
    query.orderBy = { [field]: direction && direction.toLowerCase() === 'desc' ? 'desc' : 'asc' };
  }

  if (filtrarGrupo === 'true' && groupName) {
    query.where = { criado_por: groupName };
  }

  return query;
}
