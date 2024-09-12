import axios from "axios";

const REST_API_BASE_URL = 'http://localhost:8080/flights';

const FLIGHT_API_BASE_URL = "/api/v1/flights";

export function findLatestFplData(aircraftIdentification, logTimestamp) {
    return axios.get(REST_API_BASE_URL + `/find/${aircraftIdentification}/${logTimestamp}`);
}

export function findLatestDepArrData(gufi) {
    return axios.get(REST_API_BASE_URL + `/find/${gufi}`);
}

export function getDefaultSchema() {
    return axios.get(REST_API_BASE_URL + `/schema`);
}
