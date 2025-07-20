export function normalizeRole(role) {
  if (typeof role !== 'string') return role;

  const roleMap = {
    masteradmin: 'masterAdmin',
    admin: 'admin',
    agent: 'agent',
    subagent: 'subAgent',
    user: 'user',
    bankoperator: 'bankOperator'
  };

  return roleMap[role.toLowerCase()] || role;
}
