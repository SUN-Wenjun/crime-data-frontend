import { SUMMARIZED_FAILED, SUMMARIZED_FETCHING, SUMMARIZED_RECEIVED } from './constants'
import api from '../util/api'
import { calculateRates, reshapeData } from '../util/summary'

export const failedSummarized = error => ({
  type: SUMMARIZED_FAILED,
  error,
})

export const fetchingSummarized = () => ({
  type: SUMMARIZED_FETCHING,
})

export const receivedSummarized = summarized => ({
  type: SUMMARIZED_RECEIVED,
  summarized,
})

export const fetchSummarized = (filters, states) => dispatch => {
  console.log('fetchSummarized')
  dispatch(fetchingSummarized())
  const requests = api.getSummarizedRequests(filters, states)
  return Promise.all(requests)
    .then(data => reshapeData(data))
    .then(d => calculateRates(d, filters.placeType))
    .then(summaries => dispatch(receivedSummarized(summaries, filters)))
    .catch(error => dispatch(failedSummarized(error)))
}
