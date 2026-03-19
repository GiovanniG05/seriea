export default async function handler(req, res) {
  const path = req.query.path || '';
  const url = `https://api.football-data.org/v4/${path}`;
  
  const params = { ...req.query };
  delete params.path;
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  try {
    const response = await fetch(fullUrl, {
      headers: {
        'X-Auth-Token': 'fabe55864dce4c9d8d3504cfb996887a'
      }
    });
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' });
  }
}