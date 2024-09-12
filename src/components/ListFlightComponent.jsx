import React, { useState } from 'react';
import { findLatestFplData, findLatestDepArrData, getDefaultSchema } from '../services/FlightService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ListFlightComponent = () => {
    const [searchFlightId, setSearchFlightId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [flightData, setFlightData] = useState(null);
    const [gufi, setGufi] = useState('');

    const handleSubmitFpl = async (e) => {
        e.preventDefault();
        console.log('Aircraft Callsign:', searchFlightId);
        console.log('Selected Date and Time:', selectedDate);

        if (searchFlightId && selectedDate) {
            try {
                // Convert the selected date to ISO string, considering the local time zone offset
                const localDateTime = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString();
                const fplResponse = await findLatestFplData(searchFlightId, localDateTime);

                console.log('findLatestFplData Response:', fplResponse);

                if (fplResponse.data) {
                    setFlightData(fplResponse.data);
                    setGufi(fplResponse.data.gufi); // Store gufi

                    // After successfully fetching FPL data, fetch Departure/Arrival data using the same GUFI
                    const depArrResponse = await findLatestDepArrData(fplResponse.data.gufi);
                    console.log('findLatestDepArrData Response:', depArrResponse);

                    if (depArrResponse.data) {
                        // Merge the fetched departure/arrival data into the current flightData
                        setFlightData(prevData => ({
                            ...prevData,
                            departure: {
                                ...prevData?.departure,
                                actualTimeOfDeparture: depArrResponse.data.departure?.actualTimeOfDeparture || prevData?.departure?.actualTimeOfDeparture,
                            },
                            arrival: {
                                ...prevData?.arrival,
                                actualTimeOfArrival: depArrResponse.data.arrival?.actualTimeOfArrival || prevData?.arrival?.actualTimeOfArrival,
                            }
                        }));
                    } else {
                        alert('No additional departure/arrival information found.');
                    }
                } else {
                    setFlightData(null);
                    setGufi(''); 
                    alert('Flight plan not found for given callsign and time. Please try again.');
                }
            } catch (error) {
                console.error('Error fetching flight plan or departure/arrival data:', error);
                alert('Error fetching flight plan or departure/arrival data.');
            }
        } else {
            alert('Please enter a valid callsign and incident time.');
        }
    };

    const handleViewSchema = async(e) => {
        e.preventDefault();

        try {
            const response = await getDefaultSchema();

            console.log('getDefaultSchema Response:', response);

            if (response.data) {
                alert('Loading default schema...');
                setFlightData(response.data);
            }
        } catch (error) {
            console.error('Error fetching default schema:', error);
            alert('Error fetching default schema.');
        }
    };

    function formatWithNewline(input) {
        if (typeof input === 'string') {
            return input.replace("Usage:", "<br/><br/>Usage:");
        }
        return input;
    }

    return (
        <div className='container' style={{ minHeight: '125vh', overflowY: 'auto' }}>
            <br />
            <h2 className='text-center'>Safety Incident Reporting Management System</h2>
            <br />
            
            <div className="row">
                <div className='mb-3 col-3' style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Enter Aircraft Callsign"
                        value={searchFlightId}
                        onChange={(e) => setSearchFlightId(e.target.value)}
                        className="form-control"
                    />
                </div>
                <div className='mb-3 col-3' style={{ display: 'flex', alignItems: 'center' }}>
                    <DatePicker
                        selected={selectedDate}
                        onChange={date => setSelectedDate(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        placeholderText="Select Incident Time"
                        className="form-control"
                    />
                </div>
            </div>

            <div className="d-flex justify-content-between mb-3">
                <button onClick={handleSubmitFpl} className='btn btn-primary'>Search for Flight Plan</button>
                <button onClick={handleViewSchema} className='btn btn-secondary'>View Default Schema</button>
            </div>

            <br />
            <br />

            <h4>Flight Information</h4>
            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}> 
                <thead>
                    <tr>
                        <th>EOBT</th>
                        <th>ATD</th>
                        <th>Departure Aerodrome</th>
                        <th>ATA</th>
                        <th>Arrival Aerodrome</th>
                        <th>Alternate Arrival Aerodrome</th>
                    </tr>
                </thead>
                <tbody>
                    {flightData ? (
                        <tr>
                            <td>
                                {flightData.gufi === 'defaultFpl'
                                    ? flightData.departure?.estimatedOffBlockTime || 'N/A' 
                                    : flightData.departure?.estimatedOffBlockTime
                                    ? new Date(flightData.departure.estimatedOffBlockTime).toUTCString() 
                                    : 'N/A'
                                }
                            </td>
                            <td>
                                {flightData.gufi === 'defaultFpl'
                                    ? flightData.departure?.actualTimeOfDeparture || 'N/A' 
                                    : flightData.departure?.actualTimeOfDeparture
                                    ? new Date(flightData.departure.actualTimeOfDeparture).toUTCString() 
                                    : 'N/A'
                                }
                            </td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.departure?.departureAerodrome || 'N/A') }}></td>
                            <td>
                                {flightData.gufi === 'defaultFpl'
                                    ? flightData.arrival?.actualTimeOfArrival || 'N/A' 
                                    : flightData.arrival?.actualTimeOfArrival
                                    ? new Date(flightData.arrival.actualTimeOfArrival).toUTCString() 
                                    : 'N/A'
                                }
                            </td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.arrival?.destinationAerodrome || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.arrival?.destinationAerodromeAlternate || 'N/A') }}></td>
                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <br/>

            <h4>Other Information</h4>
            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}>
                <thead>
                    <tr>
                        <th>Callsign</th>
                        <th>Message Timestamp</th>
                        <th>Status</th>
                        <th>Registration</th>
                        <th>Operator</th>
                        <th>Aircraft Address</th>
                    </tr>
                </thead>
                <tbody>
                    {flightData && flightData.aircraft ? (
                        <tr>
                            
                            <td>{flightData.aircraftIdentification || 'N/A'}</td>
                            <td>
                                {flightData.gufi === 'defaultFpl'
                                    ? flightData.logTimestamp
                                    : new Date(flightData.logTimestamp).toUTCString() 
                                }
                            </td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.status || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.registration || 'N/A') }}></td>
                            <td>{flightData.operator || 'N/A'}</td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.aircraftAddress || 'N/A') }}></td>

                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>
           
            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}> 
                <thead>
                    <tr>
                        <th>Aircraft Type</th>
                        <th>Aircraft Approach Category</th>
                        <th>Aircraft Wake Turbulence</th>
                        <th>Flight Rule</th>
                        <th>Flight Type</th>
                        <th>Originator</th>
        
                    </tr>
                </thead>
                <tbody>
                    {flightData ? (
                        <tr>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.aircraftType || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.aircraftApproachCategory || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.wakeTurbulence || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.filed?.routeInformation?.flightRulesCategory|| 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.flightType || 'N/A') }}></td>
                            <td>{flightData.gufiOriginator || 'N/A'}</td>
                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}> 
                <thead>
                    <tr>
                        <th>Communication Capability Code</th>
                        <th>Datalink Capability Code</th>
                        <th>Selective Calling Code</th>
                        <th>Navigation Capability Code</th>
                        <th>Performance Based Code</th>
                        <th>Surveillance Capability Code</th>
        
                    </tr>
                </thead>
                <tbody>
                    {flightData ? (
                        <tr>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.communication?.communicationCapabilityCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.communication?.datalinkCommunicationCapabilityCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.communication?.selectiveCallingCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.navigation?.navigationCapabilityCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.navigation?.performanceBasedCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.surveillance?.surveillanceCapabilityCode || 'N/A') }}></td>
                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}> 
                <thead>
                    <tr>
                        <th>Route Information</th>
                        
                    </tr>
                </thead>
                <tbody>
                    {flightData ? (
                        <tr>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.filed?.routeInformation?.routeText|| 'N/A') }}></td>
                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="1" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <br/>
        </div>
    );
}

export default ListFlightComponent;
