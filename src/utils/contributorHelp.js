export function cleanContributors(data) {
  if (!Array.isArray(data)) {
    throw new TypeError('参数必须为贡献者数组');
  }
  return {
    contributors_count: data.length,
    contributors: data.map(item => ({
      name: item.name || '',
      email: item.email || '',
      commits: parseInt(item.contributions, 10) || 0
    }))
  };
}
