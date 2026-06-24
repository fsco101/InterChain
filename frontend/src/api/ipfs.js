import api from './client'

export const fetchIpfsRecords = () => api.get('/ipfs/records')
